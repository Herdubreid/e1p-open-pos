// AIS Definitions
declare var FORM_SERVICE: string;
declare var DATA_SERVICE: string;
declare var BATCH_FORM_SERVICE: string;
declare var APP_STACK_SERVICE: string;
declare var PO_SERVICE: string;
declare var LOG_SERVICE: string;
declare var JARGON_SERVICE: string;
declare function callAISService(input: object, service: string, callback: any): void;