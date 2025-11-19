import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getProductions, updateProduction, deleteProduction } from "../../api/productionApi";
import DataTable from "../../components/UI/DataTable";
import CuttingForm from "./CuttingForm";
import { Edit, Trash2 } from "lucide-react";
import { showConfirm, showLoading, dismissAndSuccess, dismissAndError } from "../../utils/toast";
import { getProductionColumns } from "./ProductionTableColumns";
import { useProductionStage } from "./useProductionStage";

export default function Cutting() {
  const { user } = useAuth();
  const [productions, setProductions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduction, setEditProduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  // ✅ Use the stage hook for "Cutting"
  const { stageData, getPreviousStage, getNextStage } = useProductionStage("Cutting", productions);

  useEffect(() => {
    fetchProductions();
  }, []);

  const fetchProductions = async () => {
    try {
      setLoading(true);
      const res = await getProductions();
      const allProductions = (Array.isArray(res.data) ? res.data : [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setProductions(allProductions);
      setError(null);
    } catch (err) {
      console.error("Error fetching productions", err);
      setError("Failed to fetch productions");
      setProductions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showConfirm(
      "Are you sure you want to delete this production record?",
      async () => {
        const toastId = showLoading("Deleting production...");
        try {
          await deleteProduction(id);
          await fetchProductions();
          dismissAndSuccess(toastId, "Production deleted successfully!");
        } catch (err) {
          console.error("Error deleting production", err);
          dismissAndError(toastId, `Failed to delete: ${err.response?.data?.message || err.message}`);
        }
      }
    );
  };

  const handleFormSubmit = async (data) => {
    const toastId = showLoading("Saving cutting details...");
    try {
      await updateProduction(editProduction._id, data);
      setShowForm(false);
      setEditProduction(null);
      await fetchProductions();
      dismissAndSuccess(toastId, "Cutting details saved successfully!");
    } catch (err) {
      console.error("Error saving cutting details", err);
      dismissAndError(toastId, `Failed to save: ${err.response?.data?.message || err.message}`);
    }
  };

  const columns = getProductionColumns();

  // ✅ Simple Edit & Delete buttons
  const actions = isAdmin
    ? [
        {
          label: "Edit",
          icon: Edit,
          className: "bg-blue-500 text-white hover:bg-blue-600",
          onClick: (production) => {
            // Check if production is ready for cutting
            const previousStage = getPreviousStage();
            if (production.status !== previousStage && production.status !== "Cutting") {
              alert(`This production must be in "${previousStage}" stage to enter cutting details.`);
              return;
            }
            setEditProduction(production);
            setShowForm(true);
          },
        },
        {
          label: "Delete",
          icon: Trash2,
          className: "bg-red-500 text-white hover:bg-red-600",
          onClick: (production) => handleDelete(production._id),
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading cutting data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showForm ? (
        <CuttingForm
          initialValues={editProduction}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditProduction(null);
          }}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Cutting Stage</h1>
              <p className="text-gray-600 text-sm mt-1">
                Manage cutting operations and move to stitching
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* ✅ Show table with productions ready for cutting */}
          {stageData.length > 0 ? (
            <div className="w-full overflow-x-hidden">
              <DataTable
                columns={columns}
                data={stageData}
                actions={actions}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-500 text-lg mb-2">No productions ready for Cutting</div>
              <div className="text-gray-400 text-sm">
                Productions will appear here once they complete the Store IN stage
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}