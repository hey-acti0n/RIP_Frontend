import { 
    env, 
    AutoTokenizer, 
    AutoProcessor, 
    SiglipTextModel, 
    SiglipVisionModel,
    RawImage 
} from '@huggingface/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;

const MODEL_ID = 'Xenova/siglip-base-patch16-224';

class SiglipService {
    static tokenizer: any = null;
    static processor: any = null;
    static textModel: any = null;
    static visionModel: any = null;

    static async init(progress_callback?: (data: any) => void) {
        if (!this.tokenizer) {
            const options = { device: 'wasm', dtype: 'q8' } as const;

            this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback });
            this.processor = await AutoProcessor.from_pretrained(MODEL_ID, { progress_callback });
            this.textModel = await SiglipTextModel.from_pretrained(MODEL_ID, {...options, progress_callback });
            this.visionModel = await SiglipVisionModel.from_pretrained(MODEL_ID, {...options, progress_callback });
        }
    }
}

self.addEventListener('message', async (event) => {
    const { type, data } = event.data;

    try {
        if (type === 'init') {
            await SiglipService.init((msg) => {
                self.postMessage({ type: 'progress', data: msg });
            });

            const items = data;
            const embeddings: Record<number, number[]> = {};


            const descriptions = items.map((item: any) => item.description);
            

            const text_inputs = await SiglipService.tokenizer(descriptions, { 
                padding: 'max_length', 
                truncation: true,
            });


            const { pooler_output: textOutput } = await SiglipService.textModel(text_inputs);

            // Размерность выхода SigLIP base = 768
            const embeddingSize = 768; 
            
            console.log(`Processing ${items.length} items, embedding size: ${embeddingSize}`);
            console.log(`Text output shape:`, textOutput.dims, `data length:`, textOutput.data.length);
            console.log(`Expected total size: ${items.length * embeddingSize}, actual: ${textOutput.data.length}`);

            // Проверяем формат выхода - может быть [batch_size, embedding_size] или [batch_size * embedding_size]
            const expectedTotalSize = items.length * embeddingSize;
            if (textOutput.data.length !== expectedTotalSize) {
                console.error(`ERROR: Expected ${expectedTotalSize} values, got ${textOutput.data.length}`);
                console.error(`Output dims:`, textOutput.dims);
            }

            for (let i = 0; i < items.length; i++) {
                const start = i * embeddingSize;
                const end = start + embeddingSize;
                
                // Проверяем границы
                if (end > textOutput.data.length) {
                    console.error(`ERROR: Index out of bounds for item ${items[i].id}, end=${end}, data.length=${textOutput.data.length}`);
                    continue;
                }
                
                // Этот кусок - вектор для одного описания
                const textVector = textOutput.data.slice(start, end);
                
                const itemId = items[i].id; 
                embeddings[itemId] = Array.from(textVector);
                
                // Проверяем, что вектор не пустой
                if (textVector.length !== embeddingSize) {
                    console.warn(`Warning: Item ${itemId} has incorrect embedding size: ${textVector.length} instead of ${embeddingSize}`);
                } else {
                    // Логируем первый элемент для проверки
                    if (i === 0) {
                        console.log(`Sample embedding for item ${itemId}: first 5 values =`, textVector.slice(0, 5));
                    }
                }
            }

            console.log(`Generated embeddings for ${Object.keys(embeddings).length} items`);
            console.log(`Embedding IDs:`, Object.keys(embeddings).map(id => parseInt(id)));
            self.postMessage({ type: 'text_embeddings_ready', data: embeddings });
        }

        // Если загрузили картинку
        if (type === 'image') {
            console.log('Processing image...');
            // Считываем
            const imageUrl = URL.createObjectURL(data); 
            // RawImage - утилита для работы с изображениями, без нее процессор может воспринять картинку как текст, и visionModel выдаст ошибку
            const image = await RawImage.read(imageUrl);
            
            // Обрабатываем картинку и получаем вектор
            const imageInputs = await SiglipService.processor(image);
            const { pooler_output } = await SiglipService.visionModel(imageInputs);
            
            const imageEmbedding = Array.from(pooler_output.data);
            console.log(`Image embedding generated, size: ${imageEmbedding.length}`);
            console.log(`First 5 values:`, imageEmbedding.slice(0, 5));
            
            self.postMessage({ 
                type: 'image_embedding_ready', 
                data: imageEmbedding
            });
            
            URL.revokeObjectURL(imageUrl);
        }

    } catch (error) {
        console.error(error);
        self.postMessage({ type: 'error', data: error });
    }
});
