import { AxiosRequestConfig, AxiosResponse } from "axios";

export interface AxiosRequester {
	get(url: string, options?: AxiosRequestConfig): Promise<AxiosResponse>;
}
