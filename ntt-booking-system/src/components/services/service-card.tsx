"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Tags,
  Gift,
} from "lucide-react";
import type { Service } from "@/types";
import { toggleServiceStatus, deleteService } from "@/app/actions/services";
import { useTransition } from "react";

interface ServiceCardProps {
  service: Service;
  variantCount?: number;
  addonCount?: number;
}

export function ServiceCard({
  service,
  variantCount = 0,
  addonCount = 0,
}: ServiceCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = () => {
    startTransition(async () => {
      await toggleServiceStatus(service.id, !service.is_active);
    });
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this service? This action cannot be undone.",
      )
    ) {
      startTransition(async () => {
        await deleteService(service.id);
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${!service.is_active ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <div className="relative h-40 bg-gray-100">
        {service.images && service.images.length > 0 ? (
          <Image
            src={service.images[0]}
            alt={service.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl">🏝️</div>
          </div>
        )}
        {!service.is_active && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
            Inactive
          </div>
        )}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-white/80 hover:bg-white"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/services/${service.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggleStatus}
                disabled={isPending}
              >
                {service.is_active ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isPending}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-1">
              {service.name}
            </CardTitle>
            <p className="text-xl font-bold text-teal-600 mt-1">
              {formatPrice(service.price)}
              {variantCount > 0 && (
                <span className="text-xs font-normal text-gray-500 ml-2">
                  +{variantCount} variant{variantCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {service.description && (
          <CardDescription className="line-clamp-2 mb-3">
            {service.description}
          </CardDescription>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatDuration(service.duration_minutes)}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Max {service.max_capacity}
          </div>
          {variantCount > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Tags className="h-4 w-4" />
              {variantCount} price{variantCount > 1 ? "s" : ""}
            </div>
          )}
          {addonCount > 0 && (
            <div className="flex items-center gap-1 text-amber-600">
              <Gift className="h-4 w-4" />
              {addonCount} addon{addonCount > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
