import type React from "react";

declare global {
  type SignInFormData = {
    email: string;
    password: string;
  };

  type SignUpFormData = {
    fullName: string;
    email: string;
    password: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
  };

  type CountrySelectProps = {
    name: string;
    label: string;
    control: Control;
    error?: FieldError;
    required?: boolean;
  };

  type FormInputProps = {
    name: string;
    label?: string;
    placeholder?: string;
    type?: string;
    register?: UseFormRegister;
    error?: FieldError;
    validation?: RegisterOptions;
    disabled?: boolean;
    value?: string;
  };

  type Option = {
    value: string;
    label: string;
  };

  type SelectFieldProps = {
    name: string;
    label: string;
    placeholder: string;
    options: readonly Option[];
    control: Control;
    error?: FieldError;
    required?: boolean;
  };

  type FooterLinkProps = {
    text: string;
    linkText: string;
    href: string;
  };

  type SearchCommandProps = {
    renderAs?: "button" | "text";
    label?: string | React.ReactNode;
    initialStocks: StockWithWatchlistStatus[];
  };

  type WelcomeEmailData = {
    email: string;
    name: string;
    intro: string;
  };

  type User = {
    id: string;
    name: string;
    email: string;
  };

  type Stock = {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
    logo?: string;
  };

  type StockWithWatchlistStatus = Stock & {
    isInWatchlist: boolean;
  };

  type FinnhubSearchResult = {
    symbol: string;
    description: string;
    displaySymbol?: string;
    type: string;
  };

  type FinnhubSearchResponse = {
    count: number;
    result: FinnhubSearchResult[];
  };

  type StockDetailsPageProps = {
    params: Promise<{
      symbol: string;
    }>;
  };

  type WatchlistButtonProps = {
    symbol: string;
    company: string;
    isInWatchlist: boolean;
    showTrashIcon?: boolean;
    mode?: "button" | "icon";
    onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
  };

  type QuoteData = {
    c?: number;
    dp?: number;
  };

  type ProfileData = {
    name?: string;
    marketCapitalization?: number;
    logo?: string;
  };

  type FinancialsData = {
    metric?: { [key: string]: number };
  };

  type SelectedStock = {
    symbol: string;
    company: string;
    currentPrice?: number;
  };

  type WatchlistTableProps = {
    watchlist: StockWithData[];
  };

  type StockWithData = {
    userId: string;
    symbol: string;
    company: string;
    addedAt: Date;
    currentPrice?: number;
    changePercent?: number;
    priceFormatted?: string;
    changeFormatted?: string;
    marketCap?: string;
    peRatio?: string;
    logo?: string;
  };

  type AlertsListProps = {
    alertData: Alert[] | undefined;
  };

  type MarketNewsArticle = {
    id: number;
    headline: string;
    summary: string;
    source: string;
    url: string;
    datetime: number;
    category: string;
    related: string;
    image?: string;
  };

  type WatchlistNewsProps = {
    news?: MarketNewsArticle[];
  };

  type SearchCommandProps = {
    open?: boolean;
    setOpen?: (open: boolean) => void;
    renderAs?: "button" | "text";
    buttonLabel?: string;
    buttonVariant?: "primary" | "secondary";
    className?: string;
  };

  type AlertSearchCommandProps = {
    type?: "navigation" | "alert";
    renderAs?: "button" | "text";
    label?: string | React.ReactNode;
    initialStocks: StockWithWatchlistStatus[];
  };

  type RawNewsArticle = {
    id: number;
    headline?: string;
    summary?: string;
    source?: string;
    url?: string;
    datetime?: number;
    image?: string;
    category?: string;
    related?: string;
  };

  type AlertData = {
    id: string;
    symbol: string;
    company: string;
    alertName: string;
    alertType: "upper" | "lower";
    threshold: number;
    frequency: "once" | "daily" | "hourly" | "minute";
  };

  type AlertModalProps = {
    symbol: string;
    company: string;
    currentPrice?: number;
    existingAlerts: AlertData[];
    open: boolean;
    onClose: () => void;
    editAlertId?: string;
  };

  type InputGroupFieldProps = FormInputProps & {
    mode?: "input" | "textarea";
    className?: string;
    children?: React.ReactNode;
  };
}

export {};
