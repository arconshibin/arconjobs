import React from "react";
import { useParams } from "react-router-dom";

const CandidateProfile: React.FC = () => {
  const { id } = useParams();
  return <div className="p-8">Candidate Profile Page for ID: {id}</div>;
};

export default CandidateProfile;
