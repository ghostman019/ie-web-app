import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeAddClasses from 'rehype-add-classes';
import '../styles/globals.css'; // Ensure this import is present

const WhitePaper = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWhitePaper = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/MichaelMireku/research-papers/main/README.md');
        const text = await response.text();
        setContent(text);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching white paper:', error);
        setLoading(false);
      }
    };

    fetchWhitePaper();
  }, []);

  return (
    <div className="white-paper-container p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="leaderboard-page-title text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-4 sm:mb-5 md:mb-6 text-center">WhitePaper</h1>
      {loading ? (
        <p className="text-center text-lg">Loading...</p>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            rehypeRaw,
            [rehypeAddClasses, { h1: 'text-5xl font-bold text-center mb-8', h2: 'text-3xl font-semibold mb-4', h3: 'text-2xl font-semibold mb-2', p: 'text-lg leading-relaxed mb-4', ul: 'list-disc list-inside text-lg leading-relaxed mb-4', li: 'mb-2' }]
          ]}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
};

export default WhitePaper;
