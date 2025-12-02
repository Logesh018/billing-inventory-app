import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import PurchaseItemsSection from './PurchaseItemsSection';
import OrderDetailsWithMeters from './OrderDetailsWithMeters';

const PurchaseForm = ({ initialValues, onSubmit, onCancel, submitLabel, isEditMode }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    orderDate: '',
    PoNo: '',
    orderType: '',
    buyerCode: '',
    orderStatus: '',
    products: [],
    totalQty: 0,
    purchaseDate: '', // Purchase Date field
    remarks: '',
    ...initialValues
  });

  const [purchaseItems, setPurchaseItems] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [PESNo, setPESNo] = useState('N/A');
  const [estimationDate, setEstimationDate] = useState(null);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        orderId: initialValues.orderId || initialValues.order?.orderId || '',
        orderDate: initialValues.orderDate || '',
        PoNo: initialValues.PoNo || '',
        orderType: initialValues.orderType || '',
        buyerCode: initialValues.buyerCode || '',
        orderStatus: initialValues.status || initialValues.orderStatus || '',
        products: initialValues.products || [],
        totalQty: initialValues.totalQty || 0,
        purchaseDate: initialValues.purchaseDate
          ? new Date(initialValues.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0], // Default to today
        remarks: initialValues.remarks || '',
      });

      setPESNo(initialValues.PESNo || 'N/A');
      setEstimationDate(initialValues.estimationDate || null);
    }
  }, [initialValues]);

  useEffect(() => {
    const total = purchaseItems.reduce((sum, item) => {
      return sum + item.items.reduce((itemSum, row) => {
        const rowTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.costPerUnit) || 0);
        const gstAmount = rowTotal * ((row.gstPercentage || 0) / 100);
        return itemSum + rowTotal + gstAmount;
      }, 0);
    }, 0);
    setGrandTotal(total);
  }, [purchaseItems]);

  const handleSubmit = () => {
    const fabricPurchases = [];
    const accessoriesPurchases = [];  // ✅ Single array for all accessories

    purchaseItems.forEach(item => {
      item.items.forEach(row => {
        const rowTotal = (parseFloat(row.quantity) || 0) * (parseFloat(row.costPerUnit) || 0);
        const gstAmount = rowTotal * ((row.gstPercentage || 0) / 100);
        const totalWithGst = rowTotal + gstAmount;

        const purchaseData = {
          productName: row.itemName,
          vendor: item.vendor,
          vendorCode: item.vendorCode,
          vendorId: item.supplierId,
          purchaseMode: row.purchaseUnit,
          quantity: parseFloat(row.quantity) || 0,
          costPerUnit: parseFloat(row.costPerUnit) || 0,
          totalCost: rowTotal,
          gstPercentage: row.gstPercentage || 0,
          totalWithGst: totalWithGst,
          remarks: ''
        };

        if (row.type === 'fabric') {
          purchaseData.fabricType = row.itemName;
          purchaseData.gsm = row.gsm;
          purchaseData.colors = [row.color];
          fabricPurchases.push(purchaseData);
        } else if (row.type === 'accessories') {
          // ✅ Determine accessory type based on purchase unit
          purchaseData.accessoryType = row.purchaseUnit === 'packet' ? 'packets' : 'buttons';
          purchaseData.size = 'Standard';
          purchaseData.color = row.color || '';
          accessoriesPurchases.push(purchaseData);  // ✅ Add to accessoriesPurchases
        }
      });
    });

    const submitData = {
      orderId: formData.orderId,
      purchaseDate: formData.purchaseDate || new Date().toISOString(),
      fabricPurchases,
      accessoriesPurchases,  // ✅ Send this instead of buttonsPurchases/packetsPurchases
      remarks: formData.remarks,
    };
    console.log("📤 Submitting purchase data:", submitData);  // For debugging
    onSubmit(submitData);
  };

  return (
    <div className="w-full mx-auto bg-white p-5 rounded-2xl">
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Purchase' : 'Create Purchase Entry'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditMode ? 'Update purchase details' : 'Add purchase details for materials and accessories'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium">
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </button>
          </div>
        </div>

        {/* Order Details (Read-only) */}
        <OrderDetailsWithMeters
          selectedOrder={{
            orderId: formData.orderId,
            orderDate: formData.orderDate,
            PoNo: formData.PoNo,
            orderType: formData.orderType,
            buyerCode: formData.buyerCode,
            buyerDetails: { code: formData.buyerCode },
            status: formData.orderStatus,
            products: formData.products || []
          }}
          showEstimationFields={true}
          PESNo={PESNo}
          estimationDate={estimationDate}
        />

        {/* Purchase Items Section with Date Field */}
        <PurchaseItemsSection
          purchaseItems={purchaseItems}
          setPurchaseItems={setPurchaseItems}
          showStateField={false}
          showGstTypeToggle={false}
          showPurchaseDate={true}
          purchaseDate={formData.purchaseDate}
          onPurchaseDateChange={(date) => setFormData({ ...formData, purchaseDate: date })}
        />

        {/* General Remarks and Grand Total */}
        <div className="flex justify-between pt-4">
          <div className="w-2/3">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
            <input
              type="text"
              value={formData.remarks || ''}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Additional notes..."
            />
          </div>
          <div className="bg-white rounded-lg px-6 py-3 border border-gray-200 shadow-sm min-w-[180px]">
            <div className="text-sm text-gray-600">Grand Total</div>
            <div className="text-2xl font-bold text-green-600">₹{grandTotal.toLocaleString()}</div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {submitLabel || 'Save Purchase'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseForm;