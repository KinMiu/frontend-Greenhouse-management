/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Button from "@/src/components/ui/button";
import GenericFormModal, {
  FormFieldConfig,
} from "@/src/components/ui/genericFormModal";
import Table, {TableColumn} from "@/src/components/ui/tabel";
import {
  useCreateGreenhouse,
  useDeleteGreenhouse,
  useGetMyGreenhouses,
  useUpdateGreenhouse,
} from "@/src/hooks/use-greenhouses";
import {GreenhousesType} from "@/src/types";
import {motion} from "framer-motion";
import {Edit, Trash2} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import z from "zod";

const GreenhouseSchema = z.object({
  name: z.string().min(3, "Greenhouse name must be at least 3 characters"),
  location: z.string().min(1, "Location is required"),
});

type GreenhouseFormType = z.infer<typeof GreenhouseSchema>;

const GreenhouseFields: FormFieldConfig[] = [
  {
    name: "name",
    label: "Greenhouse Name",
    placeholder: "e.g., Alpha Hydroponics",
  },
  {
    name: "location",
    label: "Location",
    placeholder: "e.g., North Wing, Building A",
  },
];

export default function GreenhousePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    (GreenhouseFormType & {id: string}) | null
  >(null);

  const {
    data: greenhouses = [],
    isLoading,
    isError,
    error,
  } = useGetMyGreenhouses();
  const createMutation = useCreateGreenhouse();
  const updateMutation = useUpdateGreenhouse();
  const deleteMutation = useDeleteGreenhouse();

  if (isError) {
    toast.error(error.message || "Failed to fetch users");
  }

  const handleOpenAdd = () => {
    setSelectedData(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: GreenhousesType) => {
    setSelectedData({
      id: row.id,
      name: row.name,
      location: row.location,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = (data: GreenhouseFormType) => {
    if (selectedData) {
      updateMutation.mutate(
        {id: selectedData.id, ...data},
        {
          onSuccess: (res: any) => {
            toast.success(res.message || "Greenhouse updated successfully");
            setIsModalOpen(false);
          },
          onError: (err: any) => toast.error(err.message),
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: (res: any) => {
          toast.success(res.message || "Greenhouse created successfully");
          setIsModalOpen(false);
        },
        onError: (err: any) => toast.error(err.message),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this greenhouse?")) {
      deleteMutation.mutate(id, {
        onSuccess: (res: any) => {
          toast.success(res.message || "Greenhouse deleted successfully");
        },
        onError: (error: any) => {
          toast.error(error.message);
        },
      });
    }
  };

  const columns: TableColumn<GreenhousesType>[] = [
    {header: "Name", accessor: "name"},
    // {header: "Email", accessor: "email"},
    {header: "Location", accessor: "location"},
    {
      header: "Created At",
      cell: (row) => {
        // console.log(user);
        const date = new Date(row.createdAt);
        const tanggal = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // const jam = date.toLocaleTimeString("id-ID", {
        //   hour: "2-digit",
        //   minute: "2-digit",
        //   second: "2-digit",
        // });
        return (
          <div className="flex flex-row gap-2">
            <p>{tanggal}</p>
            {/* <p>{jam}</p> */}
          </div>
        );
      },
    },
    {
      header: "Updated At",
      cell: (row) => {
        // console.log(user);
        const date = new Date(row.updatedAt);
        const tanggal = date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        // const jam = date.toLocaleTimeString("id-ID", {
        //   hour: "2-digit",
        //   minute: "2-digit",
        //   second: "2-digit",
        // });
        return (
          <div className="flex flex-row gap-2">
            <p>{tanggal}</p>
            {/* <p>{jam}</p> */}
          </div>
        );
      },
    },
    {
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => handleOpenEdit(row)}
            variant="ghost"
            className="p-2 text-blue-600 hover:bg-blue-50"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => handleDelete(row.id)}
            variant="ghost"
            className="p-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          {/* Teks diperbaiki */}
          <h1 className="text-2xl font-bold text-gray-800">
            Greenhouses Management
          </h1>
          <p className="text-gray-500">Manage your greenhouse locations</p>
        </div>

        {/* Tombol ADD ditekuk untuk membuka Modal, bukan pindah halaman */}
        <Button variant="primary" onClick={handleOpenAdd}>
          + Add New Greenhouse
        </Button>
      </div>
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4}}
      >
        <Table
          columns={columns}
          data={greenhouses}
          isLoading={isLoading}
          emptyMessage="No users found"
        />
      </motion.div>

      <GenericFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedData ? "Edit Greenhouse" : "Add Greenhouse"}
        schema={GreenhouseSchema}
        fields={GreenhouseFields}
        defaultValues={
          selectedData
            ? {name: selectedData.name, location: selectedData.location}
            : {name: "", location: ""}
        }
        onSubmit={handleSubmitForm}
        isLoading={isPending}
        submitText={selectedData ? "Save Changes" : "Create"}
      />
    </div>
  );
}
