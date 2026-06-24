"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadPortfolioPhotoFormAction, deletePortfolioPhotoFormAction } from "@/lib/actions";
import { Trash2 } from "lucide-react";

type PortfolioPhoto = {
  id: string;
  photoUrl: string;
  caption: string | null;
  categoryId: string;
  category: { name: string };
};

type CategoryOption = {
  id: string;
  name: string;
};

export function PortfolioManager({
  photos,
  categories,
}: {
  photos: PortfolioPhoto[];
  categories: CategoryOption[];
}) {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "");

  const grouped = categories.map((cat) => ({
    ...cat,
    photos: photos.filter((p) => p.categoryId === cat.id),
  })).filter((cat) => cat.photos.length > 0 || categories.length > 0);

  return (
    <div className="space-y-6">
      {/* Upload form */}
      <form action={uploadPortfolioPhotoFormAction} className="grid gap-3 sm:grid-cols-3">
        <select name="categoryId" required value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full">
          <option value="">Selecione categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input name="photo" type="file" accept="image/*" required className="w-full" />
        <Button type="submit" variant="secondary">Enviar foto</Button>
      </form>

      {/* Photos grid by category */}
      {grouped.map((cat) => (
        <div key={cat.id}>
          <h4 className="mb-2 text-sm font-medium text-brand-300">{cat.name} ({cat.photos.length}/5)</h4>
          {cat.photos.length === 0 ? (
            <p className="text-xs text-slate-500">Nenhuma foto nesta categoria.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {cat.photos.map((photo) => (
                <div key={photo.id} className="group relative">
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || "Foto do portfólio"}
                    className="aspect-square w-full rounded-xl object-cover border border-surface-border"
                  />
                  <form action={deletePortfolioPhotoFormAction} className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <input type="hidden" name="photoId" value={photo.id} />
                    <Button type="submit" size="sm" variant="danger" className="h-7 w-7 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
