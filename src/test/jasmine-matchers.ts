export const customMatchers = {
    equals: (matchersUtil:any) => {
        return {compare: (actual:any,expected:any) => {
            let pass;
            if(actual.equals != undefined){
                pass = actual.equals(expected);
            } else {
                pass = matchersUtil.equals(actual,expected);
            }
            if(pass) {
                return {pass:true}
            } else {
                return {pass:false, message: `Expected: ${JSON.stringify(expected)}.\n Actual: ${JSON.stringify(actual)}`}
            }
        }};
    }
}

export function jsonMatching(jsonObject:any) {
    return {
        asymmetricMatch: (other: any, matchersUtil?: any) => {
            if(jsonObject.equals != undefined){
                return jsonObject.equals(other);
              }else{
                return matchersUtil.equals(jsonObject,other);
              }
        },
        jasmineToString: () => JSON.stringify(jsonObject)
    }
}