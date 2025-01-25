"use client";

import { GroupGetResponse } from "@/app/types/Group";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const EditGroup = ({ params }: { params: { uuid: string } }) => {
  const [group, setGroup] = useState<GroupGetResponse>();
  const [nameInput, setNameInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [isValidColor, setIsValidColor] = useState(true);
  const [canSave, setCanSave] = useState(true);
  const router = useRouter();

  const api = process.env.NEXT_PUBLIC_API_URL;

  const loadGroup = async () => {
    const res = await fetch(`${api}/groups/${params.uuid}`);
    if (!res) {
      return;
    }
    const data = await res.json();
    setGroup(data);
    setNameInput(data.name);
    setColorInput(data.color);
  };

  useEffect(() => {
    const loadData = async () => {
      await loadGroup();
    };
    loadData();
  }, []);

  useEffect(() => {
    setCanSave(isValidColor);
  }, [isValidColor]);

  const handleNameInputChange = (event: any) => {
    setNameInput(event.target.value);
  };

  const handleColorInputChange = (event: any) => {
    const value = event.target.value;
    const isValidColor = /^#([0-9A-Fa-f]{3}){1,2}$/.test(value);
    setIsValidColor(isValidColor);
    setColorInput(value);
  };

  const handleSaveAndClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canSave) {
      return;
    }
    await modifyName();
    await modifyColor();
    router.push("/admin");
  };

  const modifyName = async () => {
    const bodyData = {
      newName: nameInput,
    };
    const res = await fetch(`${api}/groups/${group?.uuid}/modifyName`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    await loadGroup();
  };

  const modifyColor = async () => {
    const bodyData = {
      newColor: colorInput,
    };
    const res = await fetch(`${api}/groups/${group?.uuid}/modifyColor`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyData),
    });
    const data = await res.json();
    await loadGroup();
  };

  return (
    <div className="p-6 max-w-2xl">
      <div>
        <Link href="/admin" className="hover:text-gray-300 uppercase font-bold text-lg px-5 py-5">
          &#8249; Back
        </Link>
      </div>
      <h3 className="font-bold uppercase mt-6 text-2xl pb-4">Edit Group</h3>
      <div className="mb-4">
        <div className="flex flex-col justify-between rounded-lg mb-2 bg-gray-950 p-2 border border-gray-800 relative overflow-clip">
          <div className="flex flex-row mb-2">
            <p className="my-auto px-2 w-32">Name: </p>
            <input
              type="text"
              value={nameInput}
              onChange={handleNameInputChange}
              className="bg-gray-900 rounded-md px-4 py-3 w-full"
            />
          </div>
          <div className="flex flex-row">
            <p className="my-auto px-2 w-32">Color: </p>
            <input
              type="text"
              value={colorInput}
              onChange={handleColorInputChange}
              className={`${
                isValidColor ? "focus:ring-white" : " focus:ring-red-600 text-red-300"
              } bg-gray-900 rounded-md px-4 py-3 w-full focus:outline-none focus:ring-1 ring-transparent`}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSaveAndClose} // Handle button click
        className={`px-3 py-3 rounded-lg uppercase ${
          canSave
            ? "bg-blue-700  hover:bg-blue-600 "
            : "bg-red-300 text-gray-700 hover:bg-red-300 cursor-not-allowed"
        }`}
      >
        Save & Close
      </button>
    </div>
  );
};
export default EditGroup;
