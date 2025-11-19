export const getProductionColumns = () => {
  const truncate = (str, max = 10) => {
    if (!str) return "—";
    return str.length > max ? str.substring(0, max) + "…" : str;
  };

  return [
    {
      key: "orderDate",
      label: "Date",
      width: "5%",
      render: (p) => (
        <div className="text-[10px] leading-tight">
          {p.orderDate ? new Date(p.orderDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }) : "—"}
        </div>
      )
    },
    {
      key: "PoNo",
      label: "PO No",
      width: "8%",
      render: (p) => (
        <div className="font-medium text-[10px] leading-tight break-words">
          {p.PoNo || "—"}
        </div>
      )
    },
    {
      key: "buyerCode",
      label: "Buyer",
      width: "5%",
      render: (p) => (
        <div className="text-[10px] leading-tight break-words">
          {p.buyerCode || "—"}
        </div>
      )
    },
    {
      key: "orderType",
      label: "Type",
      width: "4%",
      render: (o) => (
        <span className={`px-1 py-0.5 rounded text-[8px] font-medium inline-block ${
          o.orderType === "JOB-Works"
            ? "bg-purple-100 text-purple-700"
            : o.orderType === "Own-Orders"
              ? "bg-teal-100 text-teal-700"
              : "bg-blue-100 text-blue-700"
        }`}>
          {o.orderType === "JOB-Works" ? "JOB" : o.orderType === "Own-Orders" ? "OWN" : "FOB"}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      width: "5%",
      render: (p) => {
        const status = p.status === "Pending Production" ? "Pending" : p.status || "Pending";
        const styles = {
          "Pending": "bg-red-500 text-white",
          "Factory Received": "bg-blue-500 text-white",
          "Cutting": "bg-blue-500 text-white",
          "Stitching": "bg-yellow-500 text-white",
          "Trimming": "bg-yellow-600 text-white",
          "QC": "bg-orange-500 text-white",
          "Ironing": "bg-purple-500 text-white",
          "Packing": "bg-indigo-500 text-white",
          "Production Completed": "bg-green-500 text-white",
        };
        return (
          <span className={`px-1 py-0.5 rounded text-[9px] font-medium inline-block ${styles[status] || "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        );
      }
    },
    {
      key: "products",
      label: "Products",
      width: "14%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[10px]">—</span>;
        }
        const productNames = p.products.map(prod => prod.productName);

        return (
          <div className="space-y-1">
            {productNames.map((name, idx) => (
              <div
                key={idx}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                <div className="font-medium text-gray-800">{truncate(name, 200)}</div>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "fabricType",
      label: "Fabric",
      width: "8%",
      render: (p) => {
        if (p.receivedFabric) {
          return (
            <div className="space-y-1">
              <div className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words">
                {truncate(p.receivedFabric, 15)}
              </div>
            </div>
          );
        }

        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[10px]">—</span>;
        }

        const types = [...new Set(p.products.map(prod => prod.fabricType).filter(Boolean))];

        return (
          <div className="space-y-1">
            {types.map((type, idx) => (
              <div
                key={idx}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                {truncate(type, 15)}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "style",
      label: "Style",
      width: "10%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[9px]">—</span>;
        }

        return (
          <div className="space-y-1">
            {p.products.map((prod, i) => (
              <div
                key={i}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words"
              >
                {/* ✅ FIXED: Check both prod.style and prod.productDetails?.style */}
                {prod.style || prod.productDetails?.style || "—"}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "color",
      label: "Color",
      width: "7%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[9px]">—</span>;
        }

        const colorData = {};
        p.products.forEach(product => {
          if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach(colorEntry => {
              if (!colorData[colorEntry.color]) colorData[colorEntry.color] = {};
              colorEntry.sizes?.forEach(s => {
                if (!colorData[colorEntry.color][s.size]) colorData[colorEntry.color][s.size] = 0;
                colorData[colorEntry.color][s.size] += s.quantity || 0;
              });
            });
          }
        });

        const colors = Object.keys(colorData);

        return (
          <div className="space-y-1">
            {colors.map((color, idx) => (
              <div
                key={idx}
                className="px-1 py-1 border border-gray-300 rounded text-[9px] leading-tight break-words font-medium"
              >
                {color}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      key: "sizeQtyByColor",
      label: "Size & Qty",
      width: "16%",
      render: (p) => {
        if (!p.products || p.products.length === 0) {
          return <span className="text-gray-400 text-[8px]">—</span>;
        }

        const colorData = {};
        p.products.forEach(product => {
          if (product.colors && Array.isArray(product.colors)) {
            product.colors.forEach(colorEntry => {
              if (!colorData[colorEntry.color]) colorData[colorEntry.color] = {};
              colorEntry.sizes?.forEach(s => {
                if (!colorData[colorEntry.color][s.size]) colorData[colorEntry.color][s.size] = 0;
                colorData[colorEntry.color][s.size] += s.quantity || 0;
              });
            });
          }
        });

        const colors = Object.keys(colorData);

        return (
          <div className="space-y-1">
            {colors.map((color, idx) => {
              const sizeQtyStr = Object.entries(colorData[color])
                .sort(([a], [b]) => {
                  const order = { XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
                  return (order[a] || 999) - (order[b] || 999);
                })
                .map(([size, qty]) => `${size}:${qty}`)
                .join(", ");

              return (
                <div
                  key={idx}
                  className="py-1 border border-gray-300 rounded text-gray-600 font-mono font-semibold text-[9px] leading-tight break-words"
                >
                  {sizeQtyStr}
                </div>
              );
            })}
          </div>
        );
      }
    },
    {
      key: "totalQty",
      label: "Total",
      width: "4%",
      render: (p) => (
        <span className="font-semibold text-blue-600 text-[10px]">
          {p.totalQty || 0}
        </span>
      )
    }
  ];
};