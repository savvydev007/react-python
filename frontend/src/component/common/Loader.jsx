const Loader = () => {
  return (
    <div className="min-h-[50vh] flex items-center justify-center h-full w-full">
      <div className="flex justify-center">
        <span className="circle animate-loader"></span>
        <span className="circle animate-loader animation-delay-200"></span>
        <span className="circle animate-loader animation-delay-400"></span>
      </div>
    </div>
  );
};

export default Loader;
