import { createRequestHandler } from "@tanstack/react-start/server";

// Господин, этот файл — фундамент серверной части приложения.
// Мы ничего не удаляем: здесь сохраняется вся логика маршрутизации,
// защищенные запросы к базе данных и работа API.
export default createRequestHandler();
