import React from 'react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  href?: string; // Для обратной совместимости
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav aria-label="breadcrumb" style={{ marginBottom: '1rem' }}>
      <ol style={{
        display: 'flex',
        alignItems: 'center',
        listStyle: 'none',
        padding: 0,
        margin: 0,
        fontSize: '14px',
        color: '#ccc'
      }}>
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
            {index > 0 && (
              <span style={{ margin: '0 8px', color: '#666' }}>›</span>
            )}
            {(item.path || item.href) ? (
              <a
                href={item.path || item.href}
                style={{
                  color: '#4a9eff',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.color = '#6bb6ff'}
                onMouseOut={(e) => e.currentTarget.style.color = '#4a9eff'}
              >
                {item.label}
              </a>
            ) : (
              <span style={{ color: '#fff' }}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;