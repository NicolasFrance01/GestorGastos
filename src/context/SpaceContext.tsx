"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Space {
  id: string;
  name: string;
  isPersonal: boolean;
}

interface SpaceContextType {
  activeSpace: Space | null;
  spaces: Space[];
  setActiveSpace: (space: Space) => void;
  isLoading: boolean;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export const SpaceProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchSpaces();
    }
  }, [session]);

  const fetchSpaces = async () => {
    try {
      const res = await fetch("/api/spaces");
      const data = await res.json();
      setSpaces(data);
      // Default to personal space
      const personal = data.find((s: Space) => s.isPersonal);
      if (personal) setActiveSpace(personal);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SpaceContext.Provider value={{ activeSpace, spaces, setActiveSpace, isLoading }}>
      {children}
    </SpaceContext.Provider>
  );
};

export const useSpace = () => {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error("useSpace must be used within a SpaceProvider");
  }
  return context;
};
