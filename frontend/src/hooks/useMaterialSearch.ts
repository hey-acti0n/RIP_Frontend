import { useState, useRef, useEffect, useMemo } from 'react';
import type { Material } from '../types/simple';
import { cosineSimilarity } from '../utils/math';

// Расширяем интерфейс для UI (добавляем score и видимость)
export interface IProcessedMaterial extends Material {
    score: number;
    isVisible: boolean;
    embedding?: number[];
}

export const useMaterialSearch = (initialMaterials: Material[]) => { 
    const [materials, setMaterials] = useState<IProcessedMaterial[]>(
        initialMaterials.map(material => ({ ...material, score: 0, isVisible: true }))
    );
    
    const [imageEmbedding, setImageEmbedding] = useState<number[] | null>(null);
    const [ready, setReady] = useState(false);
    const [progress, setProgress] = useState(0);
    
    const workerRef = useRef<Worker | null>(null);
    const embeddingsCacheRef = useRef<Record<number, number[]>>({});

    // Обновляем материалы при изменении initialMaterials
    useEffect(() => {
        setMaterials(prev => {
            // Создаем map существующих материалов по ID для сохранения эмбеддингов
            const existingMap = new Map(prev.map(m => [m.id, m]));
            
            // Обновляем материалы, сохраняя эмбеддинги из кэша
            const updated = initialMaterials.map(material => {
                const existing = existingMap.get(material.id);
                return {
                    ...material,
                    score: existing?.score || 0,
                    isVisible: existing?.isVisible !== undefined ? existing.isVisible : true,
                    embedding: existing?.embedding || embeddingsCacheRef.current[material.id]
                };
            });
            
            console.log('Materials updated, count:', updated.length, 'with embeddings:', updated.filter(m => m.embedding).length);
            return updated;
        });
    }, [initialMaterials]);

    // 1. Инициализация и получение текстовых векторов
    useEffect(() => {
        if (initialMaterials.length === 0) {
            console.log('No materials to process');
            return;
        }

        // Подготавливаем материалы для обработки: создаем описания на английском
        // Если description пустое, используем name и характеристики
        const materialsForEmbedding = initialMaterials.map(material => {
            // Создаем подробное описание на английском для CLIP
            // Важно: CLIP работает лучше с английским языком
            const description = material.description || 
                `Rubber vibration isolation material. ` +
                `Material type: ${material.material || 'rubber'}. ` +
                `Thickness: ${material.thickness || 0} millimeters. ` +
                `Density: ${material.density || 0} kilograms per cubic meter. ` +
                `Used for vibration damping and noise reduction.`;
            
            return {
                id: material.id,
                name: material.name,
                description: description
            };
        });

        // Создаем worker только если его еще нет
        if (!workerRef.current) {
            workerRef.current = new Worker(new URL('../workers/search.worker.ts', import.meta.url), {
                type: 'module'
            });

            workerRef.current.onmessage = (e) => {
                const { type, data } = e.data;

                switch (type) {
                    case 'progress':
                        if (data.status === 'progress') setProgress(data.progress);
                        else if (data.status === 'ready') setReady(true);
                        break;
                    
                    case 'text_embeddings_ready':
                        console.log('Text embeddings received:', Object.keys(data).length, 'embeddings');
                        // Сохраняем в кэш
                        embeddingsCacheRef.current = { ...embeddingsCacheRef.current, ...data };
                        
                        setMaterials(prev => {
                            const updated = prev.map(material => {
                                const embedding = data[material.id] || embeddingsCacheRef.current[material.id];
                                if (!embedding) {
                                    console.warn(`No embedding found for material ${material.id}`);
                                }
                                return {
                                    ...material,
                                    embedding: embedding
                                };
                            });
                            console.log('Updated materials with embeddings:', updated.length, 'materials');
                            console.log('Sample material with embedding:', updated.find(m => m.embedding)?.id);
                            return updated;
                        });
                        setReady(true);
                        break;

                    case 'image_embedding_ready':
                        console.log('Image embedding received, size:', data.length);
                        setImageEmbedding(data);
                        break;

                    case 'error':
                        console.error('Worker error:', data);
                        break;
                }
            };
        }

        console.log('Sending materials to worker for embedding:', materialsForEmbedding.length);
        workerRef.current.postMessage({ type: 'init', data: materialsForEmbedding });

        return () => {
            // Не завершаем worker, чтобы сохранить модель в памяти
            // workerRef.current?.terminate();
        };
    }, [initialMaterials]);

    // 2. Логика поиска и сортировки
    useEffect(() => {
        if (!imageEmbedding) {
            // Если нет изображения, сбрасываем поиск
            setMaterials(prev => prev.map(material => ({
                ...material,
                score: 0,
                isVisible: true
            })));
            return;
        }

        setMaterials(prevMaterials => {
            console.log('Processing search, materials count:', prevMaterials.length);
            console.log('Materials with embeddings:', prevMaterials.filter(m => m.embedding).length);
            
            // Если вектора описаний еще не посчитаны, нет смысла искать
            if (!prevMaterials[0]?.embedding) {
                console.warn('No embeddings found for materials yet!');
                return prevMaterials;
            }

            // Уменьшаем threshold до очень маленького значения, чтобы показывать все товары
            // SigLIP может давать отрицательные значения сходства, поэтому берем очень низкий порог
            const threshold = -1; // Показываем все товары, даже с отрицательным сходством

            const processed = prevMaterials.map(material => {
                if (!material.embedding) {
                    console.warn(`Material ${material.id} has no embedding!`);
                    return { ...material, score: -999, isVisible: false };
                }
                
                const similarity = cosineSimilarity(imageEmbedding, material.embedding);
                
                // Логируем для отладки
                console.log(`Material ${material.id} (${material.name}): similarity = ${similarity.toFixed(4)}, embedding size: ${material.embedding.length}`);
                
                return {
                    ...material,
                    score: similarity,
                    isVisible: similarity > threshold
                };
            });

            // Сортировка по убыванию рейтинга
            processed.sort((a, b) => b.score - a.score);
            
            const visibleCount = processed.filter(m => m.isVisible).length;
            console.log(`Visible materials after filtering: ${visibleCount} out of ${processed.length}`);
            
            // Логируем топ-5 результатов
            console.log('Top 5 materials by similarity:', processed.slice(0, 5).map(m => ({
                id: m.id,
                name: m.name,
                score: m.score.toFixed(4),
                isVisible: m.isVisible
            })));
            
            return processed;
        });

    }, [imageEmbedding]);

    // 3. Методы управления
    const searchByImage = (file: File) => {
        workerRef.current?.postMessage({ type: 'image', data: file });
    };

    const resetSearch = () => {
        setImageEmbedding(null);
        // Сброс: возвращаем исходный порядок (по ID), обнуляем score
        setMaterials(prev => {
            const sortedById = [...prev].sort((a, b) => a.id - b.id);
            return sortedById.map(material => ({
                ...material,
                score: 0,
                isVisible: true
            }));
        });
    };

    return {
        materials,
        ready,
        progress,
        imageEmbedding,
        searchByImage,
        resetSearch
    };
};
