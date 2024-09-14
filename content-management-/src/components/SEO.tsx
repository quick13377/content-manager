import Head from 'next/head';

interface SEOProps {
  title: string;
  description: string;
}

export function SEO({ title, description }: SEOProps) {
  return (
    
      {title}
      
      
      
    
  );
}