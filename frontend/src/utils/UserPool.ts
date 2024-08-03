import { CognitoUserPool, ICognitoUserPoolData } from "amazon-cognito-identity-js";

const poolData: ICognitoUserPoolData = {
    UserPoolId: "us-east-1_gLDc9XfU7",
    ClientId: "27e8nunqf6m35ejbpebdmuqb4o"

}
export default new CognitoUserPool(poolData);