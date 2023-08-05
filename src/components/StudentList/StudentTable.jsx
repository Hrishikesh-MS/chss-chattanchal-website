import Axios from "../../../stores/Axios";
import { useState, useEffect } from "react";
import { useNavigate, createSearchParams } from "react-router-dom";
import styles from "../../styles/admin/StudentTable/StudentListAdmin.module.css";

import jsPDF from "jspdf";
import "jspdf-autotable";

export default function StudentTable(props) {
  const [visible, setVisibile] = useState(false);
  const [data, setData] = useState([{}]);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const generatePDF = () => {
    const doc = new jsPDF();

    const tableColumn = ["Name", "Class", "AdmNo.", "Course", "ApplicationNo."];
    const tableRows = [];

    data.forEach((item) => {
      const itemData = [
        item.name,
        item.class,
        item.admissionNo,
        item.course,
        item.applicationNo,
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      styles: {
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
        fillColor: [255, 255, 255],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: "center",
      },
      bodyStyles: {
        halign: "center",
      },
    });
    doc.save("table.pdf");
  };

  //   states related to seach filters
  const [searchOptions, setSearchOptions] = useState([
    "Name",
    "Admission No.",
    "Application No.",
  ]);
  const [selectedSearchOption, setSelectedSearchOption] = useState("");

  const navigate = useNavigate();

  const profilePage = (item) => {
    navigate({
      pathname: `/${props.user}/admission/verification/student-details`,
      search: `?${createSearchParams({ id: item._id, editable: false })}`,
    });
  };

  const [allData, setAllData] = useState([]);

  function loadAllData() {
    setError("");
    Axios.post(`${props.user}/get-students`, { status: "permanent" })
      .then((res) => {
        setData(res.data);
        setAllData(res.data);
      })
      .catch((err) => {
        if (err.response == undefined) {
          setError("Server connection error");
        } else {
          setError(err.response.data);
        }
      });
  }
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const [selectedFilters, setSelectedFilters] = useState({
    course: "",
    category: "",
    gender: "",
    admissionCategory: "",
    // Add more filters here in the future if needed
  });

  // Function to filter data based on the selected filters
  function filterDataBySelectedFilters(filters) {
    if (Object.values(filters).every((val) => !val)) {
      setData(allData); // If all filters are not selected, show all data
    } else {
      const filteredData = allData.filter((item) => {
        return Object.entries(filters).every(([filterKey, filterValue]) => {
          if (!filterValue) return true; // Skip filters that are not selected
          return item[filterKey] === filterValue;
        });
      });
      setData(filteredData); // Update the data state with the filtered data
    }
  }

  // Handle filter change for any dropdown
  const handleFilterChange = (event, filterKey) => {
    const selectedValue = event.target.value;
    setSelectedFilters((prevFilters) => ({
      ...prevFilters,
      [filterKey]: selectedValue,
    }));
  };

  useEffect(() => {
    filterDataBySelectedFilters(selectedFilters);
  }, [selectedFilters]);

  const filteredData = data.filter((item) => {
    const { name, admissionNo, course } = item;
    const searchFields = `${name}${admissionNo}${course}`.toLowerCase();

    if (selectedSearchOption === "Name") {
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (selectedSearchOption === "Admission No.") {
      return (
        admissionNo &&
        admissionNo.toString().toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (selectedSearchOption === "Application No.") {
      return (
        item.applicationNo &&
        item.applicationNo.toString().includes(searchQuery.toLowerCase())
      );
    } else if (selectedSearchOption === "Course") {
      return course && course.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      return searchFields.includes(searchQuery.toLowerCase());
    }
  });

  const sortedData = filteredData.sort((a, b) => {
    if (sortColumn) {
      const columnA = a[sortColumn];
      const columnB = b[sortColumn];

      if (sortColumn === "admissionNo" || sortColumn === "class") {
        // Sort string columns
        if (columnA < columnB) {
          return sortOrder === "asc" ? -1 : 1;
        }
        if (columnA > columnB) {
          return sortOrder === "asc" ? 1 : -1;
        }
      } else if (typeof columnA === "string" && typeof columnB === "string") {
        if (isDate(columnA) && isDate(columnB)) {
          // Sort date strings
          const dateA = parseDate(columnA);
          const dateB = parseDate(columnB);
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        } else if (!isNaN(parseFloat(columnA)) && !isNaN(parseFloat(columnB))) {
          // Sort number strings
          const numA = parseFloat(columnA);
          const numB = parseFloat(columnB);
          return sortOrder === "asc" ? numA - numB : numB - numA;
        } else {
          // Sort character strings
          if (columnA < columnB) {
            return sortOrder === "asc" ? -1 : 1;
          }
          if (columnA > columnB) {
            return sortOrder === "asc" ? 1 : -1;
          }
        }
      }
    }
    return 0;
  });
  function isDate(dateString) {
    // Check if a string represents a valid date
    const dateRegex = /^\d{2}[./-]\d{2}[./-]\d{4}$/;
    return dateRegex.test(dateString);
  }

  function parseDate(dateString) {
    const [day, month, year] = dateString.split(/[./-]/);
    return new Date(year, month - 1, day);
  }

  const getSortIndicator = (column) => {
    if (sortColumn === column) {
      return sortOrder === "asc" ? "▲" : "▼";
    }
    return "";
  };

  useEffect(() => {
    loadAllData();
  }, []);

  //   function related to changing search values
  const handleSearchChange = (event) => {
    setSelectedSearchOption(event.target.value);
    setSearchQuery("");
  };

  const [selectedCategoryOption, setSelectedCategoryOption] = useState("");
  const [selectedCourseOption, setSelectedCourseOption] = useState("");
  const [selectedGenderOption, setSelectedGenderOption] = useState("");

  return (
    <>
      <div className={styles.mainContainer}>
        <div className={styles.main}>
          <div className={styles.adjustBox}>
            <div className={styles.searchCont}>
              <input
                type="text"
                placeholder={`Search ${
                  selectedSearchOption ? selectedSearchOption : "all fields"
                }`}
                value={searchQuery}
                onChange={handleSearch}
                className={styles.searchBox}
              />
              <select
                value={selectedSearchOption}
                onChange={handleSearchChange}
                className={styles.filterOption}
              >
                <option value="">Search By</option>
                {searchOptions.map((option, index) => (
                  <option
                    className={styles.filterOpt}
                    key={index}
                    value={option}
                    style={{
                      fontFamily: "poppins",
                      fontSize: 17,
                      fontWeight: 400,
                    }}
                  >
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.filterPrint}>
              <div className={styles.filterBox}>
                <div className={styles.selectPair}>
                  <label style={{width: 83}}>Course:</label>
                  <select
                    value={selectedFilters.course}
                    onChange={(e) => handleFilterChange(e, "course")}
                    className={styles.filterOption}
                  >
                    <option value="">ALL COURSES</option>
                    <option value="PCMB">PCMB</option>
                    <option value="PCMC">PCMC</option>
                    <option value="COMMERCE">COMMERCE</option>
                  </select>
                </div>
                <div className={styles.selectPair}>
                  <label style={{width: 83}}>Category:</label>
                  <select
                    value={selectedFilters.category}
                    onChange={(e) => handleFilterChange(e, "category")}
                    className={styles.filterOption}
                  >
                    <option value="">All Categories</option>
                    <option value="general">General</option>
                    <option value="HinOBC">HinOBC</option>
                    <option value="ChristOBC">ChristOBC</option>
                    <option value="OEC">OEC</option>
                    <option value="muslim">Muslim</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>

                <div className={styles.selectPair}>
                  <label style={{width: 83}}>Gender:</label>
                  <select
                    value={selectedFilters.gender}
                    onChange={(e) => handleFilterChange(e, "gender")}
                    className={styles.filterOption}
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="others">Other</option>
                  </select>
                </div>

                <div className={styles.selectPair}>
                  <label style={{width: 83}}>Admission Category:</label>
                  <select
                    value={selectedFilters.admissionCategory}
                    onChange={(e) => handleFilterChange(e, "admissionCategory")}
                    className={styles.filterOption}
                  >
                    {/* Options for Admission Category */}
                    <option value="">All</option>
                    <option value="Merit">Merit</option>
                    <option value="Management">Management</option>
                    <option value="Sports">Sports</option>
                    <option value="IED">IED</option>
                  </select>
                </div>

                {/* <option value="">Admission In:</option> */}
              </div>
              <button onClick={generatePDF} className={styles.printBtn}>
                Download as PDF
              </button>
            </div>
          </div>
          <div className={styles.table}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {/* Items Related to Search */}

                {/* -------------------------- */}
                <code
                  style={{
                    textAlign: "center",
                    color: "red",
                    left: 0,
                    minWidth: 0,
                  }}
                >
                  {error}
                </code>
              </div>

              <div className={styles.tableBox}>
                <div className={styles.forScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr key={1}>
                        <th
                          onClick={() => handleSort("name")}
                          style={{ width: 20 }}
                        >
                          Name {getSortIndicator("name")}
                        </th>
                        <th onClick={() => handleSort("class")}>
                          Class {getSortIndicator("class")}
                        </th>
                        <th onClick={() => handleSort("admissionNo")}>
                          Adm No. {getSortIndicator("admissionNo")}
                        </th>
                        <th onClick={() => handleSort("course")}>
                          Course {getSortIndicator("course")}
                        </th>

                        <th>Application No. </th>
                      </tr>
                    </thead>

                    <tbody className={styles.tableBody}>
                      {sortedData.length === 0 ? (
                        <tr key="no-data">
                          <td colSpan="5">No Student found</td>
                        </tr>
                      ) : (
                        sortedData.map((item, index) => (
                          <tr key={index}>
                            <td onClick={() => profilePage(item)}>
                              {item.name}
                            </td>
                            <td onClick={() => profilePage(item)}>
                              {item.class}
                            </td>
                            <td onClick={() => profilePage(item)}>
                              {item.admissionNo}
                            </td>
                            <td onClick={() => profilePage(item)}>
                              {item.course}
                            </td>
                            <td onClick={() => profilePage(item)}>
                              {item.applicationNo}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
