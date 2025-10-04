import { useState } from "react";
import useFabricOptions from "../api/fabricApi.js";

export default function FabricSelector({ onSelect }) {
  const fabrics = useFabricOptions();
  const [selectedFabric, setSelectedFabric] = useState("");

  const handleSelect = (e) => {
    const fabricType = e.target.value;
    setSelectedFabric(fabricType);
    const fabric = fabrics.find((f) => f.fabricType === fabricType);
    if (fabric) onSelect(fabric);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Fabric Type
      </label>
      <select
        value={selectedFabric}
        onChange={handleSelect}
        className="w-full border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="">Select Fabric</option>
        {fabrics.map((fabric) => (
          <option key={fabric._id} value={fabric.fabricType}>
            {fabric.fabricType}
          </option>
        ))}
      </select>
    </div>
  );
}
