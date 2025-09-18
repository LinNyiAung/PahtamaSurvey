import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import './App.css';

const API_BASE_URL = 'https://pahtamasurveyapi.onrender.com';

function App() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    employeeName: '',
    gender: '',
    age: '',
    waistCircumference: '',
    heightFeet: '',
    heightInches: '',
    weight: ''
  });
  const [bmiResult, setBmiResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employees`);
      const employeeOptions = response.data.map(emp => ({
        value: emp.EmployeeNumber,
        label: `${emp.EmployeeNumber} - ${emp.EmployeeName}`,
        employeeName: emp.EmployeeName, // Changed from 'name' to 'employeeName'
        employeeNumber: emp.EmployeeNumber
      }));
      setEmployees(employeeOptions);
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to load employee data');
    }
  };

  const handleEmployeeSelect = (selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        employeeNumber: selectedOption.value,
        employeeName: selectedOption.employeeName // Updated reference
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        employeeNumber: '',
        employeeName: ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateBMI = () => {
    const { waistCircumference, heightFeet, heightInches, weight } = formData;
    
    if (!waistCircumference || !heightFeet || !heightInches || !weight) {
      return null;
    }

    const totalHeightInches = parseInt(heightFeet) * 12 + parseInt(heightInches);
    const waist = parseFloat(waistCircumference);
    const weightNum = parseFloat(weight);
    
    // Standard BMI Formula: 703 * Weight(lb) / Height²(inches)
    const bmi = (703 * weightNum) / (totalHeightInches * totalHeightInches);
    
    let category = '';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi <= 24.9) category = 'Normal';
    else if (bmi <= 29.9) category = 'Overweight';
    else category = 'Obesity';

    return {
      value: bmi.toFixed(1),
      category: category
    };
  };

  useEffect(() => {
    const result = calculateBMI();
    setBmiResult(result);
  }, [formData.waistCircumference, formData.heightFeet, formData.heightInches, formData.weight]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const requiredFields = ['employeeNumber', 'gender', 'age', 'waistCircumference', 'heightFeet', 'heightInches', 'weight'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return;
    }

    const bmi = calculateBMI();
    if (!bmi) {
      alert('Unable to calculate BMI. Please check your inputs.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        bmi: parseFloat(bmi.value),
        bmiCategory: bmi.category
      };

      await axios.post(`${API_BASE_URL}/submit-survey`, submitData);
      alert('Survey submitted successfully!');
      
      // Reset form
      setFormData({
        employeeNumber: '',
        employeeName: '',
        gender: '',
        age: '',
        waistCircumference: '',
        heightFeet: '',
        heightInches: '',
        weight: ''
      });
      setBmiResult(null);
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      alert('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    border: '2px solid #e1e5e9',
    borderRadius: '8px',
    minHeight: window.innerWidth < 576 ? '44px' : '48px', // Smaller on mobile
    borderColor: state.isFocused ? '#667eea' : '#e1e5e9',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none',
    fontSize: window.innerWidth < 576 ? '14px' : '16px',
    '&:hover': {
      borderColor: '#667eea'
    }
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#667eea' : state.isFocused ? '#f8f9fa' : 'white',
    color: state.isSelected ? 'white' : '#333',
    padding: window.innerWidth < 576 ? '8px 12px' : '10px 15px',
    fontSize: window.innerWidth < 576 ? '14px' : '16px'
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999
  })
};

  // Fixed custom filter function for react-select
  const customFilterOption = (option, searchText) => {
    if (!searchText) return true;
    
    const search = searchText.toLowerCase();
    const employeeNumber = option.data.employeeNumber ? option.data.employeeNumber.toLowerCase() : '';
    const employeeName = option.data.employeeName ? option.data.employeeName.toLowerCase() : '';
    const label = option.label ? option.label.toLowerCase() : '';
    
    return employeeNumber.includes(search) || 
           employeeName.includes(search) || 
           label.includes(search);
  };

  return (
    <div className="App">
      <div className="container">
        <h1>📊 Health Survey Form</h1>
        
        <form onSubmit={handleSubmit} className="survey-form">
          
          <div className="form-group">
            <label>**Employee Code:**</label>
            <Select
              options={employees}
              onChange={handleEmployeeSelect}
              placeholder="Type to search by employee number or name..."
              isClearable
              isSearchable
              filterOption={customFilterOption}
              value={employees.find(emp => emp.value === formData.employeeNumber) || null}
              noOptionsMessage={({ inputValue }) => 
                inputValue ? `No employees found matching "${inputValue}"` : 'No employees available'
              }
              styles={selectStyles}
              menuPortalTarget={document.body} // Helps with mobile dropdown positioning
            />
            {formData.employeeNumber && (
              <small className="selected-employee">
                Selected: <strong>{formData.employeeNumber}</strong>
              </small>
            )}
          </div>

          <div className="form-group">
            <label>**Employee Name:**</label>
            <input
              type="text"
              value={formData.employeeName}
              readOnly
              placeholder="Auto-filled based on employee selection"
              className="readonly-input"
            />
          </div>

          <div className="form-group">
            <label>**Gender:**</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label>**Age:**</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              min="1"
              max="120"
              required
            />
          </div>

          <div className="form-group">
            <label>**Waist Circumference (inches):**</label>
            <input
              type="number"
              name="waistCircumference"
              value={formData.waistCircumference}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              required
            />
          </div>

          <div className="height-row">
          <div className="form-group">
            <label>**Height - Feet:**</label>
            <input
              type="number"
              name="heightFeet"
              value={formData.heightFeet}
              onChange={handleInputChange}
              min="0"
              max="10"
              required
              placeholder="ft"
            />
          </div>
          <div className="form-group">
            <label>**Height - Inches:**</label>
            <input
              type="number"
              name="heightInches"
              value={formData.heightInches}
              onChange={handleInputChange}
              min="0"
              max="11"
              required
              placeholder="in"
            />
          </div>
        </div>

          <div className="form-group">
            <label>**Weight (lb):**</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              step="0.1"
              min="0"
              required
            />
          </div>

          {bmiResult && (
            <div className="bmi-result">
              <h3>📈 BMI Calculation Result</h3>
              <div className={`bmi-display ${bmiResult.category.toLowerCase()}`}>
                <p><strong>BMI:</strong> {bmiResult.value}</p>
                <p><strong>Category:</strong> {bmiResult.category}</p>
              </div>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;