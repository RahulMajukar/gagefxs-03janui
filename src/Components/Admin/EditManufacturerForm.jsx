import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { useForm } from "react-hook-form";
import {
  parsePhoneNumberFromString,
  getExampleNumber,
} from "libphonenumber-js";
import metadata from "libphonenumber-js/metadata.full.json";
import { Factory } from "lucide-react";
import api from "../../api/axios"; // Use your configured axios instance here

const EditManufacturerForm = ({ onClose, countryData, defaultValues, onUpdate }) => {
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({ defaultValues });

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [maxDigits, setMaxDigits] = useState(15);

  const watchPhone = watch("phoneNumber");
  const watchCountry = watch("country");

  // Initialize/reset form and selected country when defaultValues or countryData change
  useEffect(() => {
  if (defaultValues && countryData.length > 0) {
    const matchedCountry = countryData.find((c) => c.code === defaultValues.country);
    let phoneOnly = defaultValues.phoneNumber || "";

    if (matchedCountry && phoneOnly.startsWith(matchedCountry.dial_code)) {
      phoneOnly = phoneOnly.slice(matchedCountry.dial_code.length); // remove +91 etc
    }

    reset({
      ...defaultValues,
      phoneNumber: phoneOnly, // store only digits without country code
    });

    setSelectedCountry(matchedCountry || null);

    if (matchedCountry) {
      setValue("country", matchedCountry.code);
    }
  }
}, [defaultValues, countryData, reset, setValue]);


  // Update selectedCountry & maxDigits when country field changes
  useEffect(() => {
    if (!watchCountry) {
      setSelectedCountry(null);
      setMaxDigits(15);
      return;
    }
    const found = countryData.find((c) => c.code === watchCountry);
    if (found) {
      setSelectedCountry(found);
      try {
        const example = getExampleNumber(found.code, metadata);
        const digitsOnly = example?.nationalNumber?.replace(/\D/g, "") || "";
        setMaxDigits(digitsOnly.length);
      } catch {
        setMaxDigits(15);
      }
    } else {
      setSelectedCountry(null);
      setMaxDigits(15);
    }
  }, [watchCountry, countryData]);

  // Validate phone number on phone or country change
  useEffect(() => {
    if (!selectedCountry?.code || !watchPhone) return;

    const full = `${selectedCountry.dial_code}${watchPhone}`;
    const parsed = parsePhoneNumberFromString(full, selectedCountry.code);

    if (!parsed || !parsed.isValid()) {
      setError("phoneNumber", {
        type: "manual",
        message: `Invalid phone number for ${selectedCountry.name}`,
      });
    } else {
      clearErrors("phoneNumber");
    }
  }, [watchPhone, selectedCountry, setError, clearErrors]);

  const onSubmit = async (data) => {
    if (!selectedCountry) {
      setError("country", {
        type: "manual",
        message: "Please select a country",
      });
      return;
    }

    const phoneDigits = (data.phoneNumber || "").replace(/\D/g, "");

    if (phoneDigits.length > 15) {
      setError("phoneNumber", {
        type: "manual",
        message: "Phone number cannot exceed 15 digits",
      });
      return;
    }

    if (maxDigits && phoneDigits.length > maxDigits) {
      setError("phoneNumber", {
        type: "manual",
        message: `Phone number must be at most ${maxDigits} digits`,
      });
      return;
    }

    const fullPhone = `${selectedCountry.dial_code}${phoneDigits}`;
    let parsed;
    try {
      parsed = parsePhoneNumberFromString(fullPhone, selectedCountry.code);
    } catch {
      parsed = null;
    }

    if (!parsed || !parsed.isValid()) {
      setError("phoneNumber", {
        type: "manual",
        message: `Invalid phone number for ${selectedCountry.name}`,
      });
      return;
    }

    if (!data.id) {
      alert("Error: Missing manufacturer ID for update.");
      return;
    }

    const formattedData = {
      ...data,
      phoneNumber: parsed.number, // E.164 format, e.g. +911234567890
    };

    try {
      const response = await api.put(`/manufacturers/${data.id}`, formattedData);
      if (onUpdate) {
        onUpdate(response.data);
      }
      alert("Manufacturer updated successfully!");
      onClose();
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      alert("Failed to update manufacturer.");
    }
  };

  return (
    <Modal
      title={
        <>
          <Factory className="text-white w-6 h-6 mr-2" />
          Edit Manufacturer Details
        </>
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4 text-sm text-left">
        {/* Manufacturer Name */}
        <div>
          <label>Manufacturer Name</label>
          <input
            {...register("name", {
              required: "Manufacturer name is required",
              pattern: {
                value: /^[A-Za-z\s]+$/,
                message: "Only letters allowed",
              },
            })}
            className="border p-2 rounded w-full"
          />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
        </div>

        {/* Contact Person */}
        <div>
          <label>Contact Person</label>
          <input
            {...register("contactPerson", {
              required: "Contact person is required",
              pattern: {
                value: /^[A-Za-z\s]+$/,
                message: "Only letters allowed",
              },
            })}
            className="border p-2 rounded w-full"
          />
          {errors.contactPerson && <p className="text-red-500">{errors.contactPerson.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label>Email</label>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
              },
            })}
            className="border p-2 rounded w-full"
            type="email"
          />
          {errors.email && <p className="text-red-500">{errors.email.message}</p>}
        </div>

        {/* Website */}
        <div>
          <label>Website</label>
          <input
            {...register("website", {
              pattern: {
                value: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-]*)*\/?$/,
                message: "Invalid URL",
              },
            })}
            className="border p-2 rounded w-full"
            placeholder="https://example.com"
          />
          {errors.website && <p className="text-red-500">{errors.website.message}</p>}
        </div>

        {/* Country */}
        <div>
          <label>Country</label>
          <select
            {...register("country", { required: "Country is required" })}
            value={selectedCountry?.code || ""}
            onChange={(e) => {
              setValue("country", e.target.value, { shouldValidate: true });
              const country = countryData.find((c) => c.code === e.target.value);
              setSelectedCountry(country || null);
            }}
            className="border p-2 rounded w-full bg-white"
          >
            <option value="">-- Select Country --</option>
            {countryData.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.country && <p className="text-red-500">{errors.country.message}</p>}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block mb-1">
            Phone Number {selectedCountry?.name ? `(Max: ${maxDigits} digits)` : ""}
          </label>
          <div className="flex items-center gap-2">
            <input
              disabled
              value={selectedCountry?.dial_code || ""}
              className="w-20 border p-2 rounded bg-gray-100"
            />
            <input
              type="tel"
              {...register("phoneNumber", {
                required: "Phone number is required",
                pattern: {
                  value: /^[0-9]*$/,
                  message: "Only digits allowed",
                },
                maxLength: maxDigits,
              })}
              onChange={(e) => setValue("phoneNumber", e.target.value.replace(/\D/g, ""))}
              className="border p-2 rounded w-full"
              placeholder="Enter phone number"
              inputMode="numeric"
            />
          </div>
          {errors.phoneNumber && <p className="text-red-500">{errors.phoneNumber.message}</p>}
        </div>

        {/* Address */}
        <div className="col-span-2">
          <label>Address</label>
          <textarea
            {...register("address", { required: "Address is required" })}
            rows={3}
            className="border p-2 rounded w-full"
          />
          {errors.address && <p className="text-red-500">{errors.address.message}</p>}
        </div>

        {/* Buttons */}
        <div className="col-span-2 flex justify-between mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditManufacturerForm;
