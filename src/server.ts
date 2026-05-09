import { createRequestHandler } from "@tanstack/react-start/server";

// Господин, этот обработчик обеспечивает работу всей серверной логики:
// маршрутизацию, запросы к базе данных Supabase и API мессенджера.
export default createRequestHandler();
