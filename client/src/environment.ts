// Webpack DefinePlugin
declare const environment: {
    NODE_ENV: string;
    HOST: string;
    PORT: string;
};

const environmental = environment;

export { environmental as environment };
