"use client";

import * as React from "react";
import {
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  ImagePlus,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, ConfirmDialog } from "@/components/ui/dialog";
import { Dropdown, DropdownItem, DropdownDivider } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { useCollection } from "@/lib/store/hooks";
import type { Collection } from "@/lib/store/collection";

interface NamedEntity {
  id: string;
  name: string;
  description?: string;
  archived?: boolean;
  logoUrl?: string;
}

interface EntityManagerProps<T extends NamedEntity> {
  collection: Collection<T>;
  singular: string;
  plural: string;
  icon: React.ReactNode;
  usageCount?: (entity: T) => number;
  usageLabel?: string;
  archivable?: boolean;
  withLogo?: boolean;
}

export function EntityManager<T extends NamedEntity>({
  collection,
  singular,
  plural,
  icon,
  usageCount,
  usageLabel = "items",
  archivable,
  withLogo,
}: EntityManagerProps<T>) {
  const toast = useToast();
  const items = useCollection(collection);
  const [editing, setEditing] = React.useState<T | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<T | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [error, setError] = React.useState("");
  const [showArchived, setShowArchived] = React.useState(false);

  const visible = items.filter((i) => (showArchived ? true : !i.archived));

  const openCreate = () => {
    setName("");
    setDescription("");
    setLogoUrl("");
    setError("");
    setCreating(true);
  };
  const openEdit = (item: T) => {
    setName(item.name);
    setDescription(item.description ?? "");
    setLogoUrl(item.logoUrl ?? "");
    setError("");
    setEditing(item);
  };
  const close = () => {
    setCreating(false);
    setEditing(null);
  };

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim(),
      ...(withLogo ? { logoUrl } : {}),
    } as Partial<T>;
    if (editing) {
      collection.update(editing.id, payload);
      toast.success(`${singular} updated`, name.trim());
    } else {
      collection.create(payload as Omit<T, "id">);
      toast.success(`${singular} created`, name.trim());
    }
    close();
  };

  const toggleArchive = (item: T) => {
    collection.update(item.id, { archived: !item.archived } as Partial<T>);
    toast.success(item.archived ? `${singular} restored` : `${singular} archived`, item.name);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    collection.remove(deleteTarget.id);
    toast.success(`${singular} deleted`, deleteTarget.name);
    setDeleteTarget(null);
  };

  return (
    <Card className="p-0">
      <CardHeader>
        <CardTitle>{plural}</CardTitle>
        <div className="flex items-center gap-2">
          {archivable && (
            <Button
              size="sm"
              variant={showArchived ? "outline" : "ghost"}
              icon={<Archive className="h-4 w-4" />}
              onClick={() => setShowArchived((s) => !s)}
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </Button>
          )}
          <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            New {singular}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {visible.length === 0 ? (
          <EmptyState
            icon={icon}
            title={`No ${plural.toLowerCase()} yet`}
            description={`Create your first ${singular.toLowerCase()} to organize products.`}
            action={
              <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                New {singular}
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((item) => (
              <li
                key={item.id}
                className="group flex items-center gap-3 px-5 py-3 hover:bg-surface-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-primary-soft text-primary">
                  {withLogo && item.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.logoUrl} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    icon
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-content">{item.name}</p>
                    {item.archived && <Badge tone="neutral">Archived</Badge>}
                  </div>
                  {item.description && (
                    <p className="truncate text-xs text-content-muted">{item.description}</p>
                  )}
                </div>
                {usageCount && (
                  <span className="text-xs text-content-muted">
                    {usageCount(item)} {usageLabel}
                  </span>
                )}
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <Dropdown
                    trigger={
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(item)}>
                      Edit
                    </DropdownItem>
                    {archivable && (
                      <DropdownItem
                        icon={item.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        onClick={() => toggleArchive(item)}
                      >
                        {item.archived ? "Restore" : "Archive"}
                      </DropdownItem>
                    )}
                    <DropdownDivider />
                    <DropdownItem tone="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleteTarget(item)}>
                      Delete
                    </DropdownItem>
                  </Dropdown>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={creating || !!editing}
        onClose={close}
        title={editing ? `Edit ${singular.toLowerCase()}` : `New ${singular.toLowerCase()}`}
        footer={
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Create"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          {withLogo && (
            <div className="flex items-center gap-4">
              <div className="relative">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="h-16 w-16 rounded-md border border-border object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border-strong bg-surface-muted text-content-subtle">
                    <ImagePlus className="h-5 w-5" />
                  </div>
                )}
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="absolute -right-2 -top-2 rounded-full bg-danger p-0.5 text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-border-strong bg-surface px-3 py-1.5 text-sm text-content hover:bg-surface-muted">
                <ImagePlus className="h-4 w-4" />
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={onLogo} />
              </label>
            </div>
          )}
          <div>
            <Label required>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              invalid={!!error}
              placeholder={`${singular} name`}
              autoFocus
            />
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description…"
            />
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={`Delete ${singular.toLowerCase()}`}
        message={`This will permanently remove “${deleteTarget?.name}”.`}
      />
    </Card>
  );
}
