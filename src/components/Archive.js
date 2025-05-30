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

};

export default Archive;