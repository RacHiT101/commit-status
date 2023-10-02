import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import axios from 'axios';
import ProjectDetails from './ProjectDetails';

// Mock Axios to prevent actual HTTP requests during tests
jest.mock('axios');

// Mock the setTimeout function
jest.useFakeTimers();

describe('ProjectDetails', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('refreshes data every 30 seconds when auto-refresh is enabled', async () => {
    const mockCommitDetails1 = [{ /* Mock data for first fetch */ }];
    const mockCommitDetails2 = [{ /* Mock data for second fetch */ }];

    // Mock Axios get requests
    axios.get
      .mockResolvedValueOnce({ data: mockCommitDetails1 })
      .mockResolvedValueOnce({ data: mockCommitDetails2 });

    const { getByText, findByText } = render(<ProjectDetails name="myrepo" isRefreshEnabled={true} />);

    // Wait for the initial data to be fetched and displayed
    await findByText('Initial Commit Message');

    // Advance the timer by 30 seconds (to simulate the passage of time)
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Wait for the second data fetch to be completed
    await findByText('Refreshed Commit Message');

    // Verify that Axios was called twice with the correct URL
    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith('https://api.github.com/repos/myrepo/commits', expect.anything());
  });

  it('does not refresh data when auto-refresh is disabled', async () => {
    const { getByText, queryByText } = render(<ProjectDetails name="myrepo" isRefreshEnabled={false} />);

    // Wait for the initial data to be fetched and displayed
    await findByText('Initial Commit Message');

    // Advance the timer by 30 seconds (to simulate the passage of time)
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Ensure that no additional fetch requests were made
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
