import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Select from "react-select";
import countryData from "country-telephone-data";
import api from "../../api/axios"; // centralized Axios instance
import Modal from "../Modal";

export default function AddSupplier({ isOpen, onClose, onSave }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const [selectedCountry, setSelectedCountry] = useState(null);

  const countryOptions = countryData.allCountries.map((c) => ({
    label: `${c.name} (${c.dialCode})`,
    value: c.iso2,
    dialCode: `+${c.dialCode}`,
  }));

  useEffect(() => {
  if (!isOpen) return;
  const defaultCountry = countryOptions.find((c) => c.value === "in");
  setSelectedCountry(defaultCountry);
  setValue("country", defaultCountry?.label || "");
  setValue("countryCode", defaultCountry?.dialCode || "");
}, [isOpen, setValue]); // ✅ FIXED


  const capitalize = (val) =>
    val ? val.charAt(0).toUpperCase() + val.slice(1) : "";

  const handleCountryChange = (selected) => {
    setSelectedCountry(selected);
    setValue("country", selected.label, { shouldValidate: true, shouldDirty: true });
    setValue("countryCode", selected.dialCode, { shouldValidate: true, shouldDirty: true });
  };

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    const payload = {
      name: data.companyName,
      contactPerson: `${data.firstName} ${data.lastName}`,
      country: data.country,
      phoneNumber: `${selectedCountry?.dialCode || ""}${data.mobile}`,
      email: data.email,
      website: data.website || null,
      notes: data.notes || null,
    };

    try {
      await api.post("/suppliers", payload);
      alert("✅ Supplier Saved Successfully!");
      onSave(payload);
      reset();
      onClose();
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("❌ Failed to save supplier");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🏭 Add Supplier">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Company Name */}
        <div>
          <label className="block font-medium">Company Name *</label>
          <input
            type="text"
            {...register("companyName", {
              required: "Company Name is required",
              validate: (value) =>
                /^[A-Za-z\s]*$/.test(value) || "Only letters and spaces allowed",
            })}
            value={watch("companyName") || ""}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, "");
              const capitalized = capitalize(cleaned);
              setValue("companyName", capitalized, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            className="w-full p-2 border rounded"
            placeholder="e.g. Mitutoyo"
          />
          {errors.companyName && (
            <p className="text-red-500 text-sm">{errors.companyName.message}</p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label className="block font-medium">First Name *</label>
          <input
            type="text"
            {...register("firstName", {
              required: "First Name is required",
              validate: (value) =>
                /^[A-Za-z\s]*$/.test(value) || "Only letters and spaces allowed",
            })}
            value={watch("firstName") || ""}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, "");
              const capitalized = capitalize(cleaned);
              setValue("firstName", capitalized, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            className="w-full p-2 border rounded"
            placeholder="John"
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm">{errors.firstName.message}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label className="block font-medium">Last Name *</label>
          <input
            type="text"
            {...register("lastName", {
              required: "Last Name is required",
              validate: (value) =>
                /^[A-Za-z\s]*$/.test(value) || "Only letters and spaces allowed",
            })}
            value={watch("lastName") || ""}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, "");
              const capitalized = capitalize(cleaned);
              setValue("lastName", capitalized, {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
            className="w-full p-2 border rounded"
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm">{errors.lastName.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="block font-medium">Country *</label>
          <Select
            options={countryOptions}
            value={selectedCountry}
            onChange={handleCountryChange}
            placeholder="Select country"
            className="text-sm"
          />
        </div>

        {/* Mobile */}
        <div>
          <label className="block font-medium">Mobile Number *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {selectedCountry?.dialCode || "+91"}
            </span>
            <input
              type="tel"
              {...register("mobile", {
                required: "Mobile number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Enter valid 10-digit number",
                },
              })}
              className="w-full pl-16 p-2 border rounded"
              placeholder="0000000000"
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
              }}
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
      
        <div>
  <label className="block font-medium" htmlFor="email">Email *</label>
  <input
    id="email"
    type="email"
    autoComplete="email"
    {...register("email", {
      required: "Email is required",
      pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  message: "Invalid email format",

      },
    })}
    className="w-full p-2 border rounded"
    placeholder="supplier@email.com"
    aria-invalid={errors.email ? "true" : "false"}
  />
  {errors.email && (
    <p className="text-red-500 text-sm" role="alert">
      {errors.email.message}
    </p>
  )}
</div>


        {/* Website */}
        <div>
          <label className="block font-medium">Website</label>
          <input
            type="url"
            {...register("website")}
            className="w-full p-2 border rounded"
            placeholder="https://example.com"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block font-medium">Notes</label>
          <textarea
            {...register("notes")}
            className="w-full p-2 border rounded"
            placeholder="Any remarks or notes"
          />
        </div>

        {/* Submit */}
        <div className="text-right">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            💾 Save Supplier
          </button>
        </div>
      </form>
    </Modal>
  );
}
