//src/api/fabricApi
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";

const response = await axiosInstance.get("/fabrics");
export default function useFabricOptions() {
  const [fabricOptions, setFabricOptions] = useState([]);

  useEffect(() => {
     fetch(response)
      .then((res) => res.json())
      .then((data) => setFabricOptions(data))
      .catch((err) => console.error("Error fetching fabric master", err));
  }, []);

  return fabricOptions;
}
