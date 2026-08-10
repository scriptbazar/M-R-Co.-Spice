import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function DynamicPage({ slug, title }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pages/${slug}`)
      .then(res => {
        if (!res.ok) throw new Error('Page not found');
        return res.json();
      })
      .then(data => {
        setPage(data);
        setError('');
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <p>Loading page...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '4rem 1rem' }}>
      {/* We use a rich-text wrapper class to ensure standard styling for raw HTML */}
      <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: page.content }}></div>
    </div>
  );
}
