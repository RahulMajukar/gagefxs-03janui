import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Select from "react-select";
import countryData from "country-telephone-data";
import api from "../../api/axios";
import Modal from "../Modal";
import { Factory, Save, MapPin, Phone, XCircle } from "lucide-react";
import { isValidPhoneNumber } from "libphonenumber-js";

export default function AddManufacturer({ isOpen, onClose, onSave }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [sameAsPermanent, setSameAsPermanent] = useState(false);

  // Permanent & Current Address state
  const [permanent, setPermanent] = useState({
    country: "",
    state: "",
    city: "",
    pincode: "",
  });
  const [current, setCurrent] = useState({
    country: "",
    state: "",
    city: "",
    pincode: "",
  });

  // Dropdown lists
  const [countryList, setCountryList] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [currentStateList, setCurrentStateList] = useState([]);
  const [currentCityList, setCurrentCityList] = useState([]);

  const countryOptions = countryData.allCountries.map((c) => ({
    label: `${c.name} (${c.dialCode})`,
    value: c.iso2,
    dialCode: `+${c.dialCode}`,
  }));

  // Fetch country list
  useEffect(() => {
    fetch("https://countriesnow.space/api/v0.1/countries")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) {
          const countries = data.data.map((c) => ({
            label: c.country,
            value: c.country,
          }));
          setCountryList(countries);
        }
      })
      .catch((err) => console.error("Country fetch error:", err));
  }, []);

  // Country change handlers
  const handleCountrySelect = async (selected, type) => {
    if (type === "permanent") {
      setPermanent((prev) => ({ ...prev, country: selected.value }));
      setStateList([]);
      setCityList([]);
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selected.value }),
      });
      const data = await res.json();
      if (data?.data?.states) {
        setStateList(data.data.states.map((s) => ({ label: s.name, value: s.name })));
      }
    } else {
      setCurrent((prev) => ({ ...prev, country: selected.value }));
      setCurrentStateList([]);
      setCurrentCityList([]);
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: selected.value }),
      });
      const data = await res.json();
      if (data?.data?.states) {
        setCurrentStateList(data.data.states.map((s) => ({ label: s.name, value: s.name })));
      }
    }
  };

  const handleStateSelect = async (selected, type) => {
    if (type === "permanent") {
      setPermanent((prev) => ({ ...prev, state: selected.value }));
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: permanent.country,
          state: selected.value,
        }),
      });
      const data = await res.json();
      if (data?.data) {
        setCityList(data.data.map((c) => ({ label: c, value: c })));
      }
    } else {
      setCurrent((prev) => ({ ...prev, state: selected.value }));
      const res = await fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: current.country,
          state: selected.value,
        }),
      });
      const data = await res.json();
      if (data?.data) {
        setCurrentCityList(data.data.map((c) => ({ label: c, value: c })));
      }
    }
  };

  const handleCitySelect = (selected, type) => {
    if (type === "permanent") {
      setPermanent((prev) => ({ ...prev, city: selected.value }));
    } else {
      setCurrent((prev) => ({ ...prev, city: selected.value }));
    }
  };

  const handlePincodeChange = (e, type) => {
    const value = e.target.value;
    if (type === "permanent") setPermanent((prev) => ({ ...prev, pincode: value }));
    else setCurrent((prev) => ({ ...prev, pincode: value }));
  };

  // Handle Same as Permanent
  useEffect(() => {
    if (sameAsPermanent) {
      setCurrent(permanent);
      setCurrentStateList(stateList);
      setCurrentCityList(cityList);
    }
  }, [sameAsPermanent, permanent, stateList, cityList]);

  // Phone validation
  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, "");
    setValue("phoneNumber", input);
    if (selectedCountry) {
      const fullNumber = `${selectedCountry.dialCode}${input}`;
      if (!isValidPhoneNumber(fullNumber)) {
        setPhoneError("Invalid phone number for selected country");
      } else {
        setPhoneError("");
      }
    }
  };

  const onSubmit = async (data) => {
    if (phoneError) {
      alert("Please fix phone number before submitting.");
      return;
    }

    // Combine both addresses into one address field
    const address = `
      Permanent: ${permanent.country || ""}, ${permanent.state || ""}, ${permanent.city || ""}, ${permanent.pincode || ""}
      | Current: ${current.country || ""}, ${current.state || ""}, ${current.city || ""}, ${current.pincode || ""}
    `.trim();

    const payload = {
      name: data.name,
      address,
      country: selectedCountry?.label || "",
      contactPerson: data.contactPerson,
      phoneNumber: `${selectedCountry?.dialCode || ""}${data.phoneNumber}`,
      email: data.email,
      website: data.website,
      description: data.notes,
      certificationNumber: data.certificationNumber,
    };

    try {
      await api.post("/manufacturers", payload);
      alert("✅ Manufacturer Saved Successfully!");
      onSave(payload);
      reset();
      onClose();
    } catch (error) {
      console.error("❌ Error saving manufacturer:", error.response?.data || error.message);
      alert("❌ Failed to save manufacturer");
    }
  };

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add OEM (Original Equipment Manufacturer)">
      <div className="max-h-[80vh] overflow-y-auto pr-2 w-[900px] mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Manufacturer Info */}
          <div className="bg-white border rounded-xl p-6 shadow-md">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
              <Factory className="w-6 h-6 text-blue-600" />
              Manufacturer Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer Name *
                </label>
                <input
                  type="text"
                  {...register("name", {
                    required: "Manufacturer name is required",
                    minLength: { value: 3, message: "Minimum 3 characters required" },
                  })}
                  className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter manufacturer name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Person *</label>
                <input
                  type="text"
                  {...register("contactPerson", {
                    required: "Contact person is required",
                  })}
                  className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter contact person name"
                />
                {errors.contactPerson && (
                  <p className="text-red-500 text-sm mt-1">{errors.contactPerson.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="bg-white border rounded-xl p-6 shadow-md">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
              Address Details
            </h3>

            {/* Permanent Address */}
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-2">Permanent Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-4">
                <Select options={countryList} onChange={(v) => handleCountrySelect(v, "permanent")} placeholder="Select Country" />
                <Select options={stateList} onChange={(v) => handleStateSelect(v, "permanent")} placeholder="Select State" />
                <Select options={cityList} onChange={(v) => handleCitySelect(v, "permanent")} placeholder="Select City" />
                <input
                  type="text"
                  value={permanent.pincode}
                  onChange={(e) => handlePincodeChange(e, "permanent")}
                  placeholder="Enter Pincode"
                  className="w-full border rounded-lg px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={sameAsPermanent}
                onChange={(e) => setSameAsPermanent(e.target.checked)}
              />
              <label className="text-gray-700 text-sm">Current address same as permanent</label>
            </div>

            {/* Current Address */}
            {!sameAsPermanent && (
              <div>
                <h4 className="text-md font-semibold text-gray-700 mb-2">Current Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  <Select options={countryList} onChange={(v) => handleCountrySelect(v, "current")} placeholder="Select Country" />
                  <Select options={currentStateList} onChange={(v) => handleStateSelect(v, "current")} placeholder="Select State" />
                  <Select options={currentCityList} onChange={(v) => handleCitySelect(v, "current")} placeholder="Select City" />
                  <input
                    type="text"
                    value={current.pincode}
                    onChange={(e) => handlePincodeChange(e, "current")}
                    placeholder="Enter Pincode"
                    className="w-full border rounded-lg px-4 py-3 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="bg-white border rounded-xl p-6 shadow-md">
            <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
              <Phone className="w-6 h-6 text-purple-600" />
              Contact Details
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4 text-left">
              <Select
                options={countryOptions}
                value={selectedCountry}
                onChange={(selected) => {
                  setSelectedCountry(selected);
                  setValue("country", selected.label);
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-3 bg-gray-100 border rounded-lg text-gray-700">
                    {selectedCountry?.dialCode}
                  </span>
                  <input
                    type="tel"
                    value={watch("phoneNumber") || ""}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Enter phone number"
                  />
                </div>
                {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-left">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded p-2"
                  placeholder="example@domain.com"
                  {...register("email", { required: "Email is required" })}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input
                  type="url"
                  className="w-full border rounded p-2"
                  placeholder="https://example.com"
                  {...register("website")}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="sticky bottom-0 bg-white border-t pt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg shadow hover:bg-gray-400 transition"
            >
              <XCircle className="w-5 h-5" />
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg shadow hover:bg-blue-700 transition"
            >
              <Save className="w-5 h-5" />
              Save
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
