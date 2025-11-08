import React from 'react';
import { Breadcrumb } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Breadcrumbs.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const SimpleBreadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <Breadcrumb className="custom-breadcrumb">
      <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
        Главная
      </Breadcrumb.Item>
      {!!items.length &&
        items.map((item, index) => (
          <React.Fragment key={index}>
            <Breadcrumb.Item className="slash">/</Breadcrumb.Item>
            {index === items.length - 1 ? (
              <Breadcrumb.Item>{item.label}</Breadcrumb.Item>
            ) : (
              <Breadcrumb.Item linkAs={Link} linkProps={{ to: item.path || "" }}>
                {item.label}
              </Breadcrumb.Item>
            )}
          </React.Fragment>
        ))}
    </Breadcrumb>
  );
};

export default SimpleBreadcrumbs;
