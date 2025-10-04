import { useState } from "react";
import { axiosInstance } from "../lib/axios";

export default function NewFabricForm({ onSave, onCancel }) {
  const [fabricType, setFabricType] = useState("");
  const [colors, setColors] = useState([]);
  const [styles, setStyles] = useState([]);
  const [gsm, setGsm] = useState([]);

  const handleSave = async () => {
    const fabricData = { 
      fabricType, 
      fabricColors: colors, 
      fabricStyles: styles, 
      gsm 
    };
    
    try {
      const { data: saved } = await axiosInstance.post("/fabrics", fabricData);
      onSave(saved);
    } catch (err) {
      console.error("Error saving fabric:", err);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
      <h3 className="font-semibold text-gray-700">Add New Fabric</h3>
      <input
        type="text"
        placeholder="Fabric Type"
        value={fabricType}
        onChange={(e) => setFabricType(e.target.value)}
        className="w-full border px-3 py-2 rounded-lg"
      />
      {/* Repeat similar inputs for colors, styles, gsm (with + buttons if needed) */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}