import { useState, useRef } from "react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LogoUploaderProps {
  logo: string;
  onLogoChange: (logo: string) => void;
}

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export function LogoUploader({ logo, onLogoChange }: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        title: "Format non supporté",
        description: "Veuillez utiliser PNG, JPG ou WebP.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximum est de 500 Ko.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onLogoChange(result);
      toast({
        title: "Logo chargé",
        description: "Le logo a été mis à jour avec succès.",
      });
    };
    reader.onerror = () => {
      toast({
        title: "Erreur",
        description: "Impossible de lire le fichier.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onLogoChange("");
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    toast({
      title: "Logo supprimé",
      description: "Le logo a été retiré.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-6">
        {/* Logo preview */}
        <div className="flex-shrink-0">
          {logo ? (
            <div className="relative group">
              <div className="w-24 h-24 rounded-lg border-2 border-border overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={logo}
                  alt="Logo de l'entreprise"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Upload area */}
        <div className="flex-1">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-muted/50"
              }
            `}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleInputChange}
              className="hidden"
            />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium">
              Glissez-déposez votre logo ici
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ou cliquez pour sélectionner un fichier
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG ou WebP • Max 500 Ko
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
