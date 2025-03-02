import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Spinner } from 'react-bootstrap';

/**
 * SearchBox component for user input with loading indicator
 * Supports both direct value/onChange pattern and debounced onSearch pattern
 */
const SearchBox = ({ 
  placeholder, 
  value, 
  onChange, 
  isLoading,
  onSearch,
  debounceMs = 300
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const debounceTimer = useRef(null);
  const isFirstRender = useRef(true);
  
  // Handle two different modes: controlled (with value/onChange) or uncontrolled (with onSearch)
  const isControlled = value !== undefined && onChange !== undefined;
  const isSearching = isLoading || searching;

  // Initialize searchQuery with the provided value (if controlled)
  useEffect(() => {
    if (isControlled && value !== undefined) {
      setSearchQuery(value);
    }
  }, [isControlled, value]);

  // For debounced search
  useEffect(() => {
    // Skip the first render to prevent unnecessary search
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!onSearch) return;
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // If empty query, search immediately (to reset)
    if (searchQuery === '') {
      onSearch('');
      setSearching(false);
      return;
    }

    // Set new timer
    setSearching(true);
    debounceTimer.current = setTimeout(() => {
      onSearch(searchQuery);
      setSearching(false);
    }, debounceMs);

    // Cleanup on unmount
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery, onSearch, debounceMs]);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    
    if (isControlled) {
      // If controlled, call the onChange prop
      onChange(e);
    } else {
      // Otherwise handle internally
      setSearchQuery(newValue);
    }
  };

  return (
    <div className="search-box mb-4">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder={placeholder || "Search..."}
          value={isControlled ? value : searchQuery}
          onChange={handleChange}
          aria-label="Search"
        />
        {isSearching && (
          <InputGroup.Text>
            <Spinner animation="border" size="sm" />
          </InputGroup.Text>
        )}
      </InputGroup>
    </div>
  );
};

export default SearchBox; 