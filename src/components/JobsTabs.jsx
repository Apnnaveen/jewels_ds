// src/components/JobsTabs.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobsCounts } from "./JobsCountsProvider";
import { getSubsPermissions } from "../api";
import Loading from "./Loading/LoadingTabs"; // 👈 import your spinner

const JobsTabs = ({ activeTab: initialActiveTab, user }) => {
  const navigate = useNavigate();
  const { counts } = useJobsCounts();

  const [tabsToShow, setTabsToShow] = useState([]);
  const [activeTab, setActiveTab] = useState(initialActiveTab || "");
  const [loading, setLoading] = useState(true); // 👈 loading state

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true); // 👈 start spinner
      try {
        if (user?.user_type === "subs") {
          const resp = await getSubsPermissions(user.driver_id, user.token);

          if (resp?.quotation_process == 1 && resp?.assign_journeys_process == 0) {
            setTabsToShow([
              { label: "Quotation", path: "/available-jobs", key: "available", type: "quotation" },
              { label: "My Quotes", path: "/bid-history", key: "bid", type: "quotation" },
              { label: "Availability", path: "/scheduled-jobs", key: "scheduled", type: "quotation" },
            ]);
            if (!activeTab) setActiveTab("available");
          } else if (resp?.assign_journeys_process == 1 && resp?.quotation_process == 0) {
            setTabsToShow([
              { label: "Tomorrow Journeys", path: "/tomorrow-journeys", key: "tomorrow", type: "assign" },
              { label: "Assigned Journeys", path: "/upcoming-journeys", key: "upcoming", type: "assign" },
              { label: "Completed Journeys", path: "/completed-jobs", key: "completed", type: "assign" },
            ]);
            if (!activeTab) setActiveTab("tomorrow");
          } else {
            setTabsToShow([
              { label: "Quotation", path: "/available-jobs", key: "available", type: "quotation" },
              { label: "My Quotes", path: "/bid-history", key: "bid", type: "quotation" },
              { label: "Availability", path: "/scheduled-jobs", key: "scheduled", type: "quotation" },
              { label: "Tomorrow Journeys", path: "/tomorrow-journeys", key: "tomorrow", type: "assign" },
              { label: "Assigned Journeys", path: "/upcoming-journeys", key: "upcoming", type: "assign" },
              { label: "Completed Journeys", path: "/completed-jobs", key: "completed", type: "assign" },
            ]);
            if (!activeTab) setActiveTab(initialActiveTab || "available");
          }
        } else {
          setTabsToShow([
            { label: "Quotation", path: "/available-jobs", key: "available", type: "quotation" },
            { label: "My Quotes", path: "/bid-history", key: "bid", type: "quotation" },
            { label: "Availability", path: "/scheduled-jobs", key: "scheduled", type: "quotation" },
            { label: "Tomorrow Journeys", path: "/tomorrow-journeys", key: "tomorrow", type: "assign" },
            { label: "Assigned Journeys", path: "/upcoming-journeys", key: "upcoming", type: "assign" },
            { label: "Completed Journeys", path: "/completed-jobs", key: "completed", type: "assign" },
          ]);
          if (!activeTab) setActiveTab(initialActiveTab || "available");
        }
      } catch (err) {
        console.error("Failed to fetch subs permissions:", err);
      } finally {
        setLoading(false); // 👈 stop spinner
      }
    };

    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, initialActiveTab]);

  return (
    <div className="w-full">
      <div className="w-full bg-yellow-100 border border-yellow-300 rounded-lg mb-4 overflow-hidden shadow">
        <marquee behavior="scroll" direction="left" className="text-sm text-yellow-800 font-semibold py-2 px-4">
          Welcome to Driver / Supplier Portal
        </marquee>
      </div>

      {/* 👇 Show loading spinner until tabs are ready */}
      {loading ? (
        <div className="flex justify-center items-center py-6">
          <Loading />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          {tabsToShow.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                navigate(tab.path, { state: { user } });
              }}
              className={`py-3 px-4 rounded-2xl text-sm font-semibold shadow-md transition-all duration-200 flex items-center justify-center gap-2
                ${activeTab === tab.key
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <span className="flex items-center justify-center gap-1">
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                    {counts[tab.key]}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsTabs;
