import { createContext, useContext } from "react";

/* Signed-in client, their campaigns and the one on screen (see session.jsx). */
export const ClientCtx = createContext(null);
export const useClient = () => useContext(ClientCtx);
