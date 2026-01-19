import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Phone, MapPin, Coins, Save, RotateCcw, Check, Sun, Moon, Monitor, Image } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/components/theme/ThemeProvider";
import { LogoUploader } from "@/components/settings/LogoUploader";
import { DepartmentsManager, DEFAULT_DEPARTMENTS } from "@/components/settings/DepartmentsManager";
import { PositionsManager, DEFAULT_POSITIONS } from "@/components/settings/PositionsManager";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const settingsSchema = z.object({
  companyName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  companyAddress: z.string().max(200),
  companyPhone: z.string().max(30),
  currency: z.string().min(1, "La devise est requise"),
  currencySymbol: z.string().min(1, "Le symbole est requis").max(10),
  locale: z.string().min(1, "La locale est requise"),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const CURRENCIES = [
  { code: "MGA", symbol: "Ar", name: "Ariary malgache", locale: "fr-MG" },
  { code: "XOF", symbol: "FCFA", name: "Franc CFA (BCEAO)", locale: "fr-CI" },
  { code: "XAF", symbol: "FCFA", name: "Franc CFA (BEAC)", locale: "fr-CM" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "fr-FR" },
  { code: "USD", symbol: "$", name: "Dollar américain", locale: "en-US" },
  { code: "GNF", symbol: "FG", name: "Franc guinéen", locale: "fr-GN" },
  { code: "MAD", symbol: "DH", name: "Dirham marocain", locale: "fr-MA" },
  { code: "TND", symbol: "DT", name: "Dinar tunisien", locale: "fr-TN" },
];

const THEMES = [
  { value: "light", label: "Clair", icon: Sun },
  { value: "dark", label: "Sombre", icon: Moon },
  { value: "system", label: "Système", icon: Monitor },
] as const;

export default function Settings() {
  const { toast } = useToast();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const [isSaved, setIsSaved] = useState(false);
  const [logo, setLogo] = useState(settings.companyLogo || "");
  const [departments, setDepartments] = useState<string[]>(settings.departments || DEFAULT_DEPARTMENTS);
  const [positions, setPositions] = useState<string[]>(settings.positions || DEFAULT_POSITIONS);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyPhone: settings.companyPhone,
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      locale: settings.locale,
    },
  });

  const handleSubmit = (data: SettingsFormData) => {
    updateSettings({ ...data, companyLogo: logo, departments, positions });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    toast({
      title: "Paramètres enregistrés",
      description: "Vos paramètres ont été mis à jour avec succès.",
    });
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
      form.setValue('currency', currency.code);
      form.setValue('currencySymbol', currency.symbol);
      form.setValue('locale', currency.locale);
    }
  };

  const handleReset = () => {
    resetSettings();
    setLogo("");
    setDepartments(DEFAULT_DEPARTMENTS);
    setPositions(DEFAULT_POSITIONS);
    form.reset({
      companyName: "VOTRE ENTREPRISE",
      companyAddress: "Adresse de l'entreprise",
      companyPhone: "+261 XX XX XXX XX",
      currency: "MGA",
      currencySymbol: "Ar",
      locale: "fr-MG",
    });
    setTheme("system");
    toast({
      title: "Paramètres réinitialisés",
      description: "Les paramètres par défaut ont été restaurés.",
    });
  };

  // Preview amount for currency
  const previewAmount = 1500000;
  const previewFormatted = new Intl.NumberFormat(form.watch('locale'), {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(previewAmount) + ' ' + form.watch('currencySymbol');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
        <p className="page-description">Configuration de l'application</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Informations de l'entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informations de l'entreprise
              </CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur les documents PDF générés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ma Société SARL" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Adresse
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Rue Exemple, Antananarivo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Téléphone
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+261 XX XX XXX XX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Logo de l'entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo de l'entreprise
              </CardTitle>
              <CardDescription>
                Ce logo apparaîtra dans l'en-tête des documents PDF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogoUploader logo={logo} onLogoChange={setLogo} />
            </CardContent>
          </Card>

          {/* Thème */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Choisissez le thème de l'interface
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {THEMES.map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    type="button"
                    variant={theme === value ? "default" : "outline"}
                    className="flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => setTheme(value)}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Devise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Devise
              </CardTitle>
              <CardDescription>
                Configurez la devise utilisée pour les montants
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Devise</FormLabel>
                    <Select onValueChange={handleCurrencyChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une devise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map(curr => (
                          <SelectItem key={curr.code} value={curr.code}>
                            {curr.name} ({curr.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currencySymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbole</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ar" />
                      </FormControl>
                      <FormDescription>
                        Affiché après les montants
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locale"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format régional</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="fr-MG" />
                      </FormControl>
                      <FormDescription>
                        Pour le formatage des nombres
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Aperçu du formatage :</p>
                <p className="text-2xl font-bold text-primary">{previewFormatted}</p>
              </div>
            </CardContent>
          </Card>


          {/* Actions */}
          <div className="flex justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Réinitialiser les paramètres ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action rétablira tous les paramètres à leurs valeurs par défaut.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" className="min-w-[150px]">
              {isSaved ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Enregistré !
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
