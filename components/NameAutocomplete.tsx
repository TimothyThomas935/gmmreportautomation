"use client";

import { useState } from "react";
import { getNameSuggestions } from "../queries/getNameSuggestions";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const NameAutocomplete = ({ value, onChange }: Props) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (val.length > 1) {
      const matches = await getNameSuggestions(val);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name: string) => {
    onChange(name);
    setSuggestions([]);
  };

  return (
    <div className="relative w-64">
      <input
        type="text"
        placeholder="Enter first name"
        value={value}
        onChange={handleInputChange}
        className="border rounded px-3 py-2 w-full"
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border border-gray-300 rounded shadow-md z-10 mt-1 max-h-40 overflow-y-auto">
          {suggestions.map((name, index) => (
            <li
              key={index}
              className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
              onClick={() => handleSuggestionClick(name)}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NameAutocomplete;
