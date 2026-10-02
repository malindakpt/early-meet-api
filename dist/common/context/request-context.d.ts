export interface IRequestContext {
    requestId: string;
}
export declare function runWithRequestContext<T>(context: IRequestContext, work: () => T): T;
export declare function currentRequestId(): string | undefined;
