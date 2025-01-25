import React, { useState } from "react";

interface IncrementButtonProps {
  group: { uuid: string };
  addScore: (uuid: string, increment: number) => void;
}

const IncrementButton: React.FC<IncrementButtonProps> = ({ group, addScore }) => {
  const [customIncrement, setCustomIncrement] = useState(10);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setCustomIncrement(value);
    } else {
      setCustomIncrement(0); // Default to 0 if input is invalid
    }
  };

  const handleAddScore = () => {
    addScore(group.uuid, customIncrement);
  };

  return (
    <div className="flex items-center space-x-0">
      <input
        type="number"
        value={customIncrement}
        onChange={handleInputChange}
        className="ml-2 px-2 py-1 border rounded-md w-16 bg-transparent text-lg"
        placeholder="Amount"
      />
      <button
        type="button"
        onClick={handleAddScore}
        className="px-3 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600"
      >
        +
      </button>
    </div>
  );
};

export default IncrementButton;
