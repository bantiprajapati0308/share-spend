import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { appConfigApi } from '../../../services/api/appConfigApi';
import { setPaymentMethods } from '../../../redux/appConfigSlice';

/**
 * Fetches payment methods from the API once and stores them in Redux.
 * Subsequent consumers get data from the store without re-fetching.
 */
export default function usePaymentMethods() {
    const dispatch = useDispatch();
    const paymentMethods = useSelector((state) => state.appConfig.paymentMethods);
    const loading = paymentMethods.length === 0;

    useEffect(() => {
        if (paymentMethods.length > 0) return; // already in store
        appConfigApi
            .getPaymentMethods()
            .then((res) => {
                if (res?.data?.paymentMethods?.length) {
                    dispatch(setPaymentMethods(res.data.paymentMethods));
                }
            })
            .catch(() => {
                // Server always has a fallback — silence the error
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return { paymentMethods, loading };
}
