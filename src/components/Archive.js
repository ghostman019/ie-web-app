import React, { useState, useEffect } from 'react';
import '../styles/Archive.css';

const Archive = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const query = {
        query: `
          query {
            transactions(tags: [{name: "App-Name", values: ["Internet1.5"]}]) {
              edges {
                node {
                  id
                  tags {
                    name
                    value
                  }
                }
              }
            }
          }
        `,
      };

      const response = await fetch('https://arweave.net/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      const data = await response.json();
      setResults(data.data.transactions.edges);
    };

    fetchData();
  }, []);

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredResults = results.filter((result) =>
    result.node.tags.some((tag) => tag.value.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="archive p-4 bg-gray-800 rounded-lg shadow-lg text-white">
      <h2 className="text-2xl font-semibold mb-2">Search Archived Content</h2>
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={handleSearch}
        className="mb-4 block w-full text-black p-2 rounded"
      />
      <ul>
        {filteredResults.map((result) => (
          <li key={result.node.id} className="mb-2">
            <a href={`https://arweave.net/${result.node.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-500">
              {result.node.id}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Archive;