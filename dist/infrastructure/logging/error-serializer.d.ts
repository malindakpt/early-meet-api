export interface ISerializedError {
    cause?: ISerializedError | string;
    code?: string;
    message: string;
    name: string;
    stack?: string;
}
export declare function serializeError(error: unknown, depth?: number): ISerializedError;
