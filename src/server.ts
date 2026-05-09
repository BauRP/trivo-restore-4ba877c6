import { createRequestHandler } from "@tanstack/start/server";

// Этот обработчик отвечает за всю логику мессенджера на стороне сервера
// (маршрутизация, работа с базой Supabase, API запросы)
export default createRequestHandler();
