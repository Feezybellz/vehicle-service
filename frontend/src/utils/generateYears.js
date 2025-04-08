const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear + 1; year >= 1900; year--) {
    years.push(year);
  }
  return years;
};

export default generateYearOptions;
