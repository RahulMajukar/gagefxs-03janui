import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { useForm } from "react-hook-form";
import { parsePhoneNumberFromString, getExampleNumber } from "libphonenumber-js";
import { Wrench } from "lucide-react";
import api from "../../api/axios";

const EditServiceProviderForm = ({ defaultValues, countryData, onClose, onUpdate }) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [maxDigits, setMaxDigits] = useState(15);

  const watchCountry = watch("serviceCountry");
  const watchPhone = watch("servicePhone");

  const [providerTypes, setProviderTypes] = useState([]);
  const [accreditations, setAccreditations] = useState([]);

  // Fetch enums once
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

  // Reset form when defaultValues or countryData changes
  useEffect(() => {
    if (defaultValues && countryData?.length) {
      const providerId = defaultValues.id || defaultValues._id || defaultValues?.serviceProviderId || null;

      let phoneOnly = defaultValues.servicePhone || "";
      if (defaultValues.serviceCountry) {
        const matchedCountry = countryData.find((c) => c.name === defaultValues.serviceCountry);
        if (matchedCountry && phoneOnly.startsWith(matchedCountry.dial_code)) {
          phoneOnly = phoneOnly.slice(matchedCountry.dial_code.length);
        }
        setSelectedCountry(matchedCountry || null);
      }

      reset({ ...defaultValues, servicePhone: phoneOnly, id: providerId });
    }
  }, [defaultValues, countryData, reset]);

  // Update selected country and max digits
  useEffect(() => {
    if (!watchCountry) {
      setSelectedCountry(null);
      setMaxDigits(15);
      return;
    }
    const found = countryData.find((c) => c.name === watchCountry);
    if (found) {
      setSelectedCountry(found);
      try {
        const example = getExampleNumber(found.code, "INTERNATIONAL");
        const digits = example?.nationalNumber?.replace(/\D/g, "") || "";
        setMaxDigits(digits.length || 10);
      } catch {
        setMaxDigits(10);
      }
    } else {
      setSelectedCountry(null);
      setMaxDigits(15);
    }
  }, [watchCountry, countryData]);

  // Validate phone
  useEffect(() => {
    if (!selectedCountry?.dial_code || !selectedCountry?.code || !watchPhone) return;
    const full = selectedCountry.dial_code + watchPhone;
    const parsed = parsePhoneNumberFromString(full, selectedCountry.code);
    if (!parsed || !parsed.isValid()) {
      setError("servicePhone", { type: "manual", message: `Invalid phone number for ${selectedCountry.name}` });
    } else {
      clearErrors("servicePhone");
    }
  }, [watchPhone, selectedCountry, setError, clearErrors]);

  const handleFormSubmit = async (data) => {
    if (!selectedCountry) {
      setError("serviceCountry", { type: "manual", message: "Please select a country" });
      return;
    }

    const phoneDigits = (data.servicePhone || "").replace(/\D/g, "");
    if (maxDigits && phoneDigits.length !== maxDigits) {
      setError("servicePhone", { type: "manual", message: `Phone number must be exactly ${maxDigits} digits` });
      return;
    }

    const fullPhone = `${selectedCountry.dial_code}${phoneDigits}`;
    const parsed = parsePhoneNumberFromString(fullPhone, selectedCountry.code);
    if (!parsed || !parsed.isValid()) {
      setError("servicePhone", { type: "manual", message: `Invalid phone number for ${selectedCountry.name}` });
      return;
    }

    const providerId = data.id || defaultValues?.id || defaultValues?._id;
    if (!providerId) {
      alert("Missing Service Provider ID for update.");
      return;
    }

    const payload = {
      name: data.serviceProviderName,
      contactPerson: data.serviceContact,
      country: selectedCountry.name,
      phoneNumber: parsed.number,
      email: data.serviceEmail,
      website: data.serviceWebsite || "",
      accreditationNumber: data.serviceAccreditation || "",
      serviceProviderType: data.serviceProviderType || "",
      address: data.serviceAddress,
      description: data.serviceNotes || "",
    };

    try {
      const response = await api.put(`/service-providers/${providerId}`, payload);
      alert("Service Provider updated successfully!");
      if (onUpdate) onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      alert("Failed to update service provider.");
    }
  };

  return (
    <Modal
      title={
        <>
          <Wrench className="text-white w-6 h-6" />
          Edit Service Provider Details
        </>
      }
      onClose={onClose}
    >
      <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto p-4">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left w-full">
        <input type="hidden" {...register("id")} />

        {/* Service Provider Type */}
        <div className="col-span-2">
          <label className="block font-medium mb-1">Service Provider Type</label>
          <div className="flex gap-4">
            {providerTypes.map((type) => (
              <label key={type} className="flex items-center gap-1">
                <input
                  type="radio"
                  value={type}
                  {...register("serviceProviderType", { required: "Select service provider type" })}
                  checked={watch("serviceProviderType") === type}
                  onChange={() => setValue("serviceProviderType", type)}
                />
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
          {errors.serviceProviderType && <p className="text-red-500 text-sm">{errors.serviceProviderType.message}</p>}
        </div>

        {/* Remaining fields */}
        <label>
          Service Provider Name
          <input {...register("serviceProviderName", { required: "Name is required", pattern: { value: /^[A-Za-z\s]+$/, message: "Only letters allowed" } })} className="border p-2 rounded w-full" />
          {errors.serviceProviderName && <p className="text-red-500 text-sm">{errors.serviceProviderName.message}</p>}
        </label>

        <label>
          Contact Person
          <input {...register("serviceContact", { required: "Contact is required", pattern: { value: /^[A-Za-z\s]+$/, message: "Only letters allowed" } })} className="border p-2 rounded w-full" />
          {errors.serviceContact && <p className="text-red-500 text-sm">{errors.serviceContact.message}</p>}
        </label>

        <label>
          Country
          <select {...register("serviceCountry", { required: "Select a country" })} value={watchCountry || ""} onChange={(e) => setValue("serviceCountry", e.target.value, { shouldValidate: true })} className="border p-2 rounded w-full bg-white text-sm">
            <option value="">-- Select Country --</option>
            {Array.isArray(countryData) && countryData.length > 0 ? countryData.map((c) => <option key={c.name} value={c.name}>{c.name}</option>) : <option disabled>Loading countries...</option>}
          </select>
          {errors.serviceCountry && <p className="text-red-500 text-sm">{errors.serviceCountry.message}</p>}
        </label>

        <label>
          Phone Number
          <input type="tel" {...register("servicePhone", { required: "Phone number is required", pattern: { value: /^[0-9]{4,15}$/, message: "Only digits allowed" } })} className="border p-2 rounded w-full" placeholder={selectedCountry ? `Max ${maxDigits} digits` : ""} inputMode="numeric" />
          {errors.servicePhone && <p className="text-red-500 text-sm">{errors.servicePhone.message}</p>}
        </label>

        <label>
          Email
          <input type="email" {...register("serviceEmail", { required: "Email is required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} className="border p-2 rounded w-full" />
          {errors.serviceEmail && <p className="text-red-500 text-sm">{errors.serviceEmail.message}</p>}
        </label>

        <label>
          Website
          <input {...register("serviceWebsite", { pattern: { value: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-]*)*\/?$/, message: "Invalid URL" } })} className="border p-2 rounded w-full" placeholder="https://example.com" />
          {errors.serviceWebsite && <p className="text-red-500 text-sm">{errors.serviceWebsite.message}</p>}
        </label>

        <label>
          Accreditation
          <select {...register("serviceAccreditation", { required: "Select accreditation" })} className="border p-2 rounded w-full" value={watch("serviceAccreditation") || ""} onChange={(e) => setValue("serviceAccreditation", e.target.value)}>
            <option value="">-- Select Accreditation --</option>
            {accreditations.length > 0 ? accreditations.map((acc) => <option key={acc} value={acc}>{acc}</option>) : <option disabled>Loading...</option>}
          </select>
          {errors.serviceAccreditation && <p className="text-red-500 text-sm">{errors.serviceAccreditation.message}</p>}
        </label>

        <label className="col-span-2">
          Service Address
          <textarea {...register("serviceAddress", { required: "Address is required" })} rows={2} className="border p-2 rounded w-full" />
          {errors.serviceAddress && <p className="text-red-500 text-sm">{errors.serviceAddress.message}</p>}
        </label>

        <label className="col-span-2">
          Service Notes
          <textarea {...register("serviceNotes", { required: "Note is required" })} rows={2} className="border p-2 rounded w-full" />
          {errors.serviceNotes && <p className="text-red-500 text-sm">{errors.serviceNotes.message}</p>}
        </label>

        <div className="col-span-2 flex justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Update</button>
        </div>
      </form>
      </div>
    </Modal>
  );
};

export default EditServiceProviderForm;
