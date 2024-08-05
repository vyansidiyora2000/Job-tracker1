  import React, { ChangeEvent, useEffect, useState, FormEvent, useContext } from 'react';
  import axios from 'axios';
  import { useLocation } from 'react-router-dom';
  import JobFilters from './JobFilters';
import { Accountcontext } from '../context/Account';
import { CognitoUserSession } from 'amazon-cognito-identity-js';
  // Import the FileUpload component

  interface Job {
    jobId: string;
    position: string;
    company: string;
    status: string;
    worktype: string;
    location: string;
    file_key?: string; // Add optional fileUrl field to hold file information
  }

  interface JobFormData {
    position: string;
    company: string;
    status: string;
    worktype: string;
    location: string;
    email: string;
    fileUrl?: string; // Add optional fileUrl field to hold file information
  }

  interface Filters {
    position: Set<string>;
    worktype: Set<string>;
    status: Set<string>;
    [key: string]: Set<string>;
  }
  const apiUrl = import.meta.env.VITE_APP_URL;
  const JobList: React.FC = () => {
    const location = useLocation();
    const [jobId, setJobId] = useState<string | null>(null)
    const email = localStorage.getItem("email") || '';
    const [jobs, setJobs] = useState<Job[]>([]);
    const [token, setToken]=useState<any | null>('')
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editJobId, setEditJobId] = useState<string | null>(null);
    const [formData, setFormData] = useState<JobFormData>({
      position: '',
      company: '',
      status: '',
      worktype: '',
      location: '',
      email: email,
      fileUrl: '',
    });

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const {getSession} = useContext(Accountcontext)
    const [filters, setFilters] = useState<Filters>({
      position: new Set<string>(),
      worktype: new Set<string>(),
      status: new Set<string>(),
    });
   
    

    useEffect(() => {
      getSession()
        .then((session: CognitoUserSession) => {
          const idToken = session.getIdToken().getJwtToken();
          setToken(idToken);
          console.log(token)
        })
        .catch(() => {
          // Handle the error, e.g., by setting loggedIn state to false
        });
      fetchJobs();
    }, [email]);

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${apiUrl}/getjobs?email=${email}`);
        let jobsData: Job[];

        if (Array.isArray(response.data)) {
          jobsData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          const possibleJobsArray = Object.values(response.data).find(Array.isArray);
          if (possibleJobsArray) {
            jobsData = possibleJobsArray;
          } else {
            throw new Error('No array found in response body');
          }
        } else {
          throw new Error('Unexpected response format');
        }

        setJobs(jobsData);
        setAllJobs(jobsData);
        setError(null);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setError('Failed to fetch jobs. Please try again later.');
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prevState => ({
        ...prevState,
        [name]: value
      }));
    };

    const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    
      try {
        // Assuming formData contains the form fields
        const data = await axios.post(`${apiUrl}/createjob`, {
          ...formData,
        }, {
          headers: {
            Authorization: `Bearer YOUR_ACCESS_TOKEN` // Replace with your actual token if needed
          }
        });
    
        console.log(data);
        setShowAddForm(false);
        fetchJobs();
        resetForm();
      } catch (error) {
        console.error('Error creating job:', error);
        setError('Failed to create job. Please try again.');
      }
    };

    const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editJobId) return;
      const { email, ...updateData } = formData;
      try {
        await axios.put(`${apiUrl}/updatejob`, {
          jobId: editJobId,
          updateData
        },
      {
        headers: {
          Authorization: `Bearer`
        }
      });
        setShowEditForm(false);
        fetchJobs();
        resetForm();
      } catch (error) {
        console.error('Error updating job:', error);
        setError('Failed to update job. Please try again.');
      }
    };

    const handleDelete = async (jobId: string) => {
      try {
        await axios.delete(`${apiUrl}/deletejob`, {
          data: { jobId }
        },
        
      );
        fetchJobs();
      } catch (error) {
        console.error('Error deleting job:', error);
        setError('Failed to delete job. Please try again.');
      }
    };

    const handleEdit = (job: Job) => {
      setEditJobId(job.jobId);
      setFormData({
        position: job.position,
        company: job.company,
        status: job.status,
        worktype: job.worktype,
        location: job.location,
        email: email,
        fileUrl: job.file_key || ''
      });
      setShowEditForm(true);
    };

    const resetForm = () => {
      setFormData({
        position: '',
        company: '',
        status: '',
        worktype: '',
        location: '',
        email: email,
        fileUrl: ''
      });
      setSelectedFile(null);
      setEditJobId(null);
    };

    const handleFilterChange = (category: keyof Filters, value: string) => {
      setFilters(prevFilters => {
        const updatedFilters = new Set(prevFilters[category]);
        if (updatedFilters.has(value)) {
          updatedFilters.delete(value);
        } else {
          updatedFilters.add(value);
        }
        return {
          ...prevFilters,
          [category]: updatedFilters,
        };
      });
    };

    const handleSearchChange = (query: string) => {
      if (query.trim() === '') {
        setJobs(allJobs);
      } else {
        const filteredJobs = allJobs.filter(job =>
          job.position.toLowerCase().includes(query.toLowerCase()) ||
          job.company.toLowerCase().includes(query.toLowerCase()) ||
          job.status.toLowerCase().includes(query.toLowerCase()) ||
          job.worktype.toLowerCase().includes(query.toLowerCase()) ||
          job.location.toLowerCase().includes(query.toLowerCase())
        );
        setJobs(filteredJobs);
      }
    };

    const filteredJobs = jobs.filter(job => {
      const positionMatch = filters.position.size === 0 || filters.position.has(job.position);
      const worktypeMatch = filters.worktype.size === 0 || filters.worktype.has(job.worktype);
      const statusMatch = filters.status.size === 0 || filters.status.has(job.status);

      return positionMatch && worktypeMatch && statusMatch;
    });

    return (
      <div className="bg-gray-50 min-h-screen">
        {error && <div className="mb-4 p-4 bg-red-200 text-red-800">{error}</div>}
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg bg-gray-600">
          <JobFilters filters={filters} handleFilterChange={handleFilterChange} handleSearchChange={handleSearchChange} />
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 ml-2 mb-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Job
          </button>
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Position</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Work Type</th>
                <th className="px-6 py-3">Location</th>
               
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-4">Loading...</td>
                </tr>
              ) : (
                filteredJobs.map(job => (
                  <tr key={job.jobId} className="border-b dark:border-gray-700">
                    <td className="px-6 py-4">{job.position}</td>
                    <td className="px-6 py-4">{job.company}</td>
                    <td className="px-6 py-4">{job.status}</td>
                    <td className="px-6 py-4">{job.worktype}</td>
                    <td className="px-6 py-4">{job.location}</td>
                    {/* <td className="px-6 py-4">
                      {job.file_key ? (
                        <a href={job.file_key} target="_blank" rel="noopener noreferrer" className="text-blue-500">View File</a>
                      ) : 'No File'}
                    </td> */}
                    <td className="px-6 py-4">
                      <button onClick={() => handleEdit(job)} className="text-yellow-500 hover:text-yellow-600 mr-2">Edit</button>
                      <button onClick={() => handleDelete(job.jobId)} className="text-red-500 hover:text-red-600">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Add Job Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Add Job</h3>
              <form onSubmit={handleAddSubmit}>
                <input
                  type='text'
                  name="position"
                  placeholder='Position'
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="mb-2 w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company"
                  required
                  className="mb-2 w-full p-2 border border-gray-300 rounded"
                />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mb-2 w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <select
                  name="worktype"
                  value={formData.worktype}
                  onChange={handleChange}
                  required
                  className="mb-2 w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                >
                  <option value="" disabled>Select Work Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Location"
                  required
                  className="mb-2 w-full p-2 border border-gray-300 rounded"
                />
                {/* <input
                  type="file"
                  onChange={handleFileChange}
                  className="mb-2 w-full"
                />
                {selectedFile && (
                  <p className="mb-2 text-gray-600">Selected file: {selectedFile.name}</p>
                )} */}
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
        {/* Edit Job Form */}
        {showEditForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-lg bg-white dark:bg-gray-800">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Edit Job</h3>
              <form onSubmit={handleEditSubmit}>
                <input
                  type='text'
                  name="position"
                  placeholder='Position'
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="mb-2 w-full p-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company"
                  required
                  className="mb-2 w-full p-2 border border-gray-300 rounded"
                />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mb-2 w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Applied">Applied</option>
                  <option value="Interviewing">Interviewing</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <select
                  name="worktype"
                  value={formData.worktype}
                  onChange={handleChange}
                  required
                  className="mb-2 w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md"
                >
                  <option value="" disabled>Select Work Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                </select>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Location"
                  required
                  className="mb-2 w-full p-2 border border-gray-300 rounded"
                />
                {/* <input
                  type="file"
                  onChange={handleFileChange}
                  className="mb-2 w-full"
                />
                {formData.fileUrl && (
                  <p className="mb-2 text-gray-600">Current file: <a href={formData.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500">View File</a></p>
                )}
                {selectedFile && (
                  <p className="mb-2 text-gray-600">Selected file: {selectedFile.name}</p>
                )} */}
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="ml-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default JobList;
