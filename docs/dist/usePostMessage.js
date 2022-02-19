import {useEffect} from "../_snowpack/pkg/react.js";
function usePostMessage(listener) {
  useEffect(() => {
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [listener]);
  return (data) => window.postMessage(data, "*");
}
export default usePostMessage;
