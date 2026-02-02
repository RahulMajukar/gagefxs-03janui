import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Select from "react-select";
import countryData from "country-telephone-data";
import api from "../../api/axios";
import Modal from "../Modal";
import { isValidPhoneNumber } from "libphonenumber-js";
import {
  Building2,
  User,
  MapPin,
  Phone,
  StickyNote,
  PlusCircle,
  Save,
  Ban,
} from "lucide-react";

export default function AddServiceProvider({ isOpen, onClose, onSave }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ mode: "onChange" });

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [providerTypes, setProviderTypes] = useState([]);
  const [accreditations, setAccreditations] = useState([]);
  const [sameAsPermanent, setSameAsPermanent] = useState(false);

  // Address state
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

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        const [typesRes, accRes] = await Promise.all([
          api.get("/service-providers/enums/service-provider-types"),
          api.get("/service-providers/enums/accreditations"),
        ]);
        setProviderTypes(typesRes.data || []);
        setAccreditations(accRes.data || []);
      } catch (error) {
        console.error("Failed to fetch enums:", error);
      }
    };
    fetchEnums();
  }, []);

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

  // Handle same as permanent
  useEffect(() => {
    if (sameAsPermanent) {
      setCurrent(permanent);
      setCurrentStateList(stateList);
      setCurrentCityList(cityList);
    }
  }, [sameAsPermanent, permanent, stateList, cityList]);

  const formatEnum = (value) => {
    if (!value) return "";
    return value
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const countryOptions = countryData.allCountries.map((c) => ({
    label: `${c.name} (${c.dialCode})`,
    value: c.iso2,
    dialCode: `+${c.dialCode}`,
  }));

  useEffect(() => {
    if (isOpen) {
      const defaultCountry = countryOptions.find((c) => c.value === "us");
      setSelectedCountry(defaultCountry);
      setValue("country", defaultCountry?.value || "");
      setValue("countryCode", defaultCountry?.dialCode || "");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

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

  const handleCountryChange = (selected) => {
    setSelectedCountry(selected);
    setValue("country", selected.value, { shouldValidate: true, shouldDirty: true });
    setValue("countryCode", selected.dialCode, { shouldValidate: true, shouldDirty: true });
    setPhoneError("");
    setValue("phoneNumber", "");
  };

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
      name: data.companyName,
      contactPerson: `${data.firstName} ${data.lastName}`,
      address,
      country: selectedCountry?.label || "",
      phoneNumber: `${selectedCountry?.dialCode || ""}${data.phoneNumber}`,
      email: data.email,
      website: data.website || null,
      accreditationNumber: data.accreditationNumber || "NONE",
      description: data.description || null,
      serviceProviderType: data.serviceProviderType,
    };

    try {
      await api.post("/service-providers", payload);
      alert("✅ Service Provider Saved Successfully!");
      onSave && onSave(payload); // Call onSave if provided
      reset();
      onClose();
    } catch (error) {
      alert("❌ Failed to save service provider");
      console.error("Error saving service provider:", error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-white" />
          Add Service Provider
        </div>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 w-[900px] max-w-6xl max-h-[80vh] overflow-y-auto pr-2"
      >
        {/* Service Provider Type */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Service Provider Type</label>
          <div className="flex gap-4">
            {providerTypes.length > 0 ? (
              providerTypes.map((type) => (
                <label key={type} className="flex items-center gap-1">
                  <input
                    type="radio"
                    value={type}
                    {...register("serviceProviderType", { required: "Select provider type" })}
                  />
                  {formatEnum(type)}
                </label>
              ))
            ) : (
              <p className="text-gray-500 text-sm">Loading types...</p>
            )}
          </div>
          {errors.serviceProviderType && (
            <p className="text-red-500 text-sm">{errors.serviceProviderType.message}</p>
          )}
        </div>

        {/* Company Info */}
        <div className="bg-white border rounded-xl p-6 shadow-md">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
            <Building2 className="w-6 h-6 text-blue-600" />
            Company Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input
                type="text"
                {...register("companyName", { required: "Company Name is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Mitutoyo"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4 text-left">
            <label>
              Accreditation
              <select
                {...register("serviceAccreditation", { required: "Select accreditation" })}
                className="border p-2 rounded w-full"
              >
                <option value="">-- Select Accreditation --</option>
                {accreditations.length > 0 ? (
                  accreditations.map((acc) => (
                    <option key={acc} value={acc}>
                      {formatEnum(acc)}
                    </option>
                  ))
                ) : (
                  <option disabled>Loading...</option>
                )}
              </select>
              {errors.serviceAccreditation && (
                <p className="text-red-500 text-sm">{errors.serviceAccreditation.message}</p>
              )}
            </label>
          </div>
        </div>

        {/* Contact Person */}
        <div className="bg-white border rounded-xl p-6 shadow-md">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
            <User className="w-6 h-6 text-blue-600" />
            Contact Person
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <label className="block text-sm font-medium mb-1">First Name *</label>
              <input
                type="text"
                {...register("firstName", { required: "First name is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name *</label>
              <input
                type="text"
                {...register("lastName", { required: "Last name is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Address Details */}
        <div className="bg-white border rounded-xl p-6 shadow-md">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
            <MapPin className="w-6 h-6 text-blue-600" />
            Address Details
          </h3>

          {/* Permanent Address */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-700 mb-2">Permanent Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <Select 
                options={countryList} 
                onChange={(v) => handleCountrySelect(v, "permanent")} 
                placeholder="Select Country" 
              />
              <Select 
                options={stateList} 
                onChange={(v) => handleStateSelect(v, "permanent")} 
                placeholder="Select State" 
              />
              <Select 
                options={cityList} 
                onChange={(v) => handleCitySelect(v, "permanent")} 
                placeholder="Select City" 
              />
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
                <Select 
                  options={countryList} 
                  onChange={(v) => handleCountrySelect(v, "current")} 
                  placeholder="Select Country" 
                />
                <Select 
                  options={currentStateList} 
                  onChange={(v) => handleStateSelect(v, "current")} 
                  placeholder="Select State" 
                />
                <Select 
                  options={currentCityList} 
                  onChange={(v) => handleCitySelect(v, "current")} 
                  placeholder="Select City" 
                />
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

        {/* Contact Info */}
        <div className="bg-white border rounded-xl p-6 shadow-md">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
            <Phone className="w-6 h-6 text-blue-600" />
            Contact Info
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <Select
                options={countryOptions}
                value={selectedCountry}
                onChange={handleCountryChange}
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country.message}</p>
              )}
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="supplier@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                {...register("website")}
                className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border rounded-xl p-6 shadow-md">
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-800 mb-4">
            <StickyNote className="w-6 h-6 text-blue-600" />
            Notes
          </h3>
          <textarea
            {...register("description")}
            className="w-full px-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Any remarks or notes"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center sticky bottom-0 bg-white pt-3 pb-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Ban className="w-5 h-5" /> Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow hover:bg-blue-700"
          >
            <Save className="w-5 h-5" /> Save
          </button>
        </div>
      </form>
    </Modal>
  );
}