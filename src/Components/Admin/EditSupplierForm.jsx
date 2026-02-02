import React, { useEffect, useState } from "react";
import Modal from "../Modal";
import { useForm } from "react-hook-form";
import { parsePhoneNumberFromString, getExampleNumber } from "libphonenumber-js";

/**
 * EditSupplierForm
 * - Fetches country list from restcountries API (name, cca2, idd)
 * - Keeps layout & fields same as your original form
 * - Pre-selects country from defaultValues.country or from the stored phone number
 */
const EditSupplierForm = ({ onClose, defaultValues = {}, onSubmit }) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  // local countries state (always an array)
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [maxDigits, setMaxDigits] = useState(15);

  // watch the correct fields
  const watchCountry = watch("country");
  const watchPhone = watch("phoneNumber");

  // 1) Reset form when defaultValues change (so react-hook-form sees updated defaults)
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  // 2) Fetch & format countries from REST Countries API
  useEffect(() => {
    let cancelled = false;
    const fetchCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags"
        );
        const data = await res.json();

        if (!Array.isArray(data)) {
          // guard: if API changes, make sure we don't break .map
          console.warn("Countries response is not an array:", data);
          setCountries([]);
          return;
        }

        const formatted = data
          .map((c) => {
            const dial =
              c.idd?.root && c.idd?.suffixes && c.idd.suffixes.length
                ? c.idd.root + c.idd.suffixes[0]
                : c.idd?.root || "";
            return {
              name: c.name?.common || "",
              dial_code: dial, // like +91 or 91 depending on api (we keep as returned)
              code: c.cca2 || "", // ISO2 uppercase e.g. "IN"
              flag: c.cca2 ? `https://flagcdn.com/w20/${c.cca2.toLowerCase()}.png` : "",
            };
          })
          .filter((c) => c.name && c.code) // ensure minimal fields
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!cancelled) setCountries(formatted);
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        setCountries([]);
      }
    };

    fetchCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  // 3) Once countries loaded, try to preselect the supplier's country:
  // prefer defaultValues.country, else detect from phone (full or partial)
  useEffect(() => {
    if (!countries.length) return;

    const trySelect = async () => {
      let match = null;

      // if explicit country in defaultValues (could be code or name or dial_code)
      if (defaultValues?.country) {
        match =
          countries.find((c) => c.code === (defaultValues.country || "").toUpperCase()) ||
          countries.find((c) => c.name === defaultValues.country) ||
          countries.find((c) => c.dial_code === defaultValues.country);
      }

      // If not found, try parsing phone number
      if (!match) {
        const rawPhone =
          defaultValues?.phone ||
          defaultValues?.phoneNumber ||
          defaultValues?.fullPhone ||
          defaultValues?.contactPhone ||
          "";
        if (rawPhone) {
          try {
            const parsed = parsePhoneNumberFromString(rawPhone);
            if (parsed?.country) {
              match = countries.find((c) => c.code === parsed.country);
              if (match) {
                // set the phone field to the national number without country code
                setValue("phoneNumber", parsed.nationalNumber || "");
              }
            }
          } catch (err) {
            // ignore parse errors
          }
        }
      }

      // fallback: if still not matched, leave unselected (or pick a default if you prefer)
      if (match) {
        setSelectedCountry(match);
        setValue("country", match.code);
      }
    };

    trySelect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries, defaultValues, setValue]);

  // 4) When the watched country (select) changes, set selectedCountry & example digits
  useEffect(() => {
    if (!watchCountry || !countries.length) {
      setSelectedCountry(null);
      return;
    }
    const found = countries.find((c) => c.code === watchCountry || c.name === watchCountry);
    if (found) {
      setSelectedCountry(found);
      try {
        // getExampleNumber sometimes expects ISO2; pass found.code
        const example = getExampleNumber(found.code);
        const digits = example?.nationalNumber?.replace(/\D/g, "") || "";
        setMaxDigits(digits.length || 10);
      } catch {
        setMaxDigits(10);
      }
    } else {
      setSelectedCountry(null);
    }
  }, [watchCountry, countries]);

  // 5) Live phone validation using selectedCountry
  useEffect(() => {
    if (!selectedCountry || !watchPhone) return;

    // normalize dial code: REST API returned idd.root + suffix (like "+91" or "91")
    const dial = selectedCountry.dial_code || "";
    const full = `${dial}${watchPhone}`.replace(/\s+/g, "");
    try {
      const parsed = parsePhoneNumberFromString(full, selectedCountry.code);
      if (!parsed || !parsed.isValid()) {
        setError("phoneNumber", {
          type: "manual",
          message: `Invalid phone number for ${selectedCountry.name}`,
        });
      } else {
        clearErrors("phoneNumber");
      }
    } catch (err) {
      // treat parse errors as invalid
      setError("phoneNumber", {
        type: "manual",
        message: `Invalid phone number for ${selectedCountry.name}`,
      });
    }
  }, [watchPhone, selectedCountry, setError, clearErrors]);

  // Submit handler (preserve field names & layout)
  const handleFormSubmit = (data) => {
  const phoneDigits = (data.phoneNumber || "").replace(/\D/g, "") || "";



  const dial = selectedCountry?.dial_code || "";
  const full = `${dial}${phoneDigits}`;
  let parsed = null;
  try {
    parsed = parsePhoneNumberFromString(full, selectedCountry?.code);
  } catch {
    /* ignore */
  }
  if (!parsed || !parsed.isValid()) {
    setError("phoneNumber", {
      type: "manual",
      message: `Invalid phone number for ${selectedCountry?.name || "selected country"}`,
    });
    return;
  }

  const out = {
    ...data,
    fullPhone: parsed.formatInternational(),
    supplierCountry: selectedCountry?.name || data.country,
  };

  onSubmit(out);
};


  return (
    <Modal title="Edit Supplier" onClose={onClose}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Supplier Name</label>
            <input
              type="text"
              {...register("name", { required: "Supplier Name is required" })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {errors.supplierName && <p className="text-red-500 text-sm">{errors.supplierName.message}</p>}
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium mb-1">Contact Person</label>
            <input
              type="text"
              {...register("contactPerson", { required: "Contact Person is required" })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {errors.contactPerson && <p className="text-red-500 text-sm">{errors.contactPerson.message}</p>}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>

            <select
              {...register("country", { required: "Country is required" })}
              value={watch("country") || ""}
              onChange={(e) => setValue("country", e.target.value)}
              className="border border-gray-300 rounded p-2 w-full"
            >
              <option value="">Select Country</option>
              {Array.isArray(countries) && countries.length > 0 ? (
                countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} {c.dial_code ? `(${c.dial_code})` : ""}
                  </option>
                ))
              ) : (
                <option disabled>Loading...</option>
              )}
            </select>

            {errors.country && <p className="text-red-500 text-sm">{errors.country.message}</p>}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <div className="flex items-center gap-2">
              {selectedCountry?.dial_code && (
                <span className="bg-gray-100 border border-gray-300 px-2 py-2 rounded text-sm">
                  {selectedCountry.dial_code}
                </span>
              )}
              <input
                type="tel"
                placeholder={selectedCountry ? `Max ${maxDigits} digits` : "Enter phone number"}
                maxLength={maxDigits}
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                {...register("phoneNumber", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]+$/,
                    message: "Only digits allowed",
                  },
                })}
              />
            </div>
            {errors.phoneNumber && <p className="text-red-500 text-sm">{errors.phoneNumber.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Enter a valid email",
                },
              })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              type="url"
              {...register("website", {
                pattern: {
                  value: /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/[\w-]*)*\/?$/,
                  message: "Invalid website URL",
                },
              })}
              placeholder="https://example.com"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {errors.website && <p className="text-red-500 text-sm">{errors.website.message}</p>}
          </div>

          {/* Invoice/PO Number */}
          <div>
            <label className="block text-sm font-medium mb-1">Invoice/PO Number</label>
            <input
              type="text"
              {...register("invoiceNumber")}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Address</label>
            <textarea
              rows={3}
              {...register("address", { required: "Address is required" })}
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
            {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-between gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Update Supplier
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditSupplierForm;
